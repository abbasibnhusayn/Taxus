import { NextResponse } from "next/server";
import type postgres from "postgres";
import { getSession } from "@/lib/auth/session";
import { withUser, withTenant } from "@/lib/db";
import { getAssistantReply } from "@/lib/ai/gateway";

// POST /api/assistant
// Body: { conversationId?: string, message: string, scopeType?: "firm"|"client"|"engagement", scopeId?: string }
// Enforces RBAC/tenant scope server-side per SRS Volume 3 Ch.7 and Volume 4 Ch.9 —
// the caller's session determines the tenant context set on the DB
// transaction (see withTenant), and Postgres RLS makes it structurally
// impossible for the resulting queries to read another tenant's data.
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { conversationId, message, scopeType = "firm", scopeId } = await req.json();
  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "message is required." }, { status: 400 });
  }

  const memberships = await withUser(session.userId, (tx) =>
    tx`select tenant_id from tenant_memberships where user_id = ${session.userId} and is_client = false limit 1`
  );
  if (!memberships.length) return NextResponse.json({ error: "No active workspace." }, { status: 403 });
  const tenantId = memberships[0].tenant_id as string;

  const run = <T,>(fn: (tx: postgres.TransactionSql) => Promise<T>) => withTenant<T>(tenantId, session.userId, fn);

  // Build grounding context. If scoped to an engagement, RLS ensures this
  // query only succeeds if the tenant actually owns that engagement — an
  // out-of-scope engagement id simply returns no rows, not another tenant's
  // data (Volume 4 Ch.9.2, cross-tenant leakage control).
  let systemContext = `Firm: staff member of tenant ${tenantId}.`;
  if (scopeType === "engagement" && scopeId) {
    const rows = await run(
      (tx) => tx`
        select e.title, e.type, e.status, e.tax_year, e.due_date,
               c.legal_name, c.ntn, c.taxpayer_type
        from engagements e join clients c on c.id = e.client_id
        where e.id = ${scopeId} and e.tenant_id = ${tenantId}
      `
    );
    const engagement = rows[0];
    if (engagement) {
      systemContext += `\n\nScoped engagement: "${engagement.title}" (${engagement.type}, status: ${engagement.status}, tax year: ${engagement.tax_year ?? "n/a"}, due: ${engagement.due_date ?? "n/a"}). Client: ${engagement.legal_name} (${engagement.taxpayer_type}, NTN: ${engagement.ntn ?? "not on file"}).`;
    } else {
      systemContext += `\n\nNote: the requested engagement scope could not be resolved for this user's tenant. Do not answer as if you have engagement-specific data.`;
    }
  }

  let conversation = conversationId as string | undefined;
  if (!conversation) {
    const rows = await run(
      (tx) => tx`
        insert into assistant_conversations (tenant_id, user_id, scope_type, scope_id)
        values (${tenantId}, ${session.userId}, ${scopeType}, ${scopeId || null})
        returning id
      `
    );
    conversation = rows[0].id as string;
  }

  const priorMessages = await run(
    (tx) => tx`
      select role, content from assistant_messages
      where conversation_id = ${conversation} order by created_at asc limit 20
    `
  );

  const history = [...priorMessages.map((m: any) => ({ role: m.role, content: m.content })), { role: "user" as const, content: message }];

  await run(
    (tx) => tx`
      insert into assistant_messages (tenant_id, conversation_id, role, content)
      values (${tenantId}, ${conversation}, 'user', ${message})
    `
  );

  let replyText: string;
  try {
    replyText = await getAssistantReply({ systemContext, history });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "The AI Tax Assistant is not configured. Set GEMINI_API_KEY." },
      { status: 502 }
    );
  }

  await run(
    (tx) => tx`
      insert into assistant_messages (tenant_id, conversation_id, role, content)
      values (${tenantId}, ${conversation}, 'assistant', ${replyText})
    `
  );

  return NextResponse.json({ conversationId: conversation, reply: replyText });
}
