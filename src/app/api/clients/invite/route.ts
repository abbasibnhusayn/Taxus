import { NextResponse } from "next/server";
import { requireStaffContext } from "@/lib/tenant";
import { withSystem } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";

function generateTempPassword() {
  // Human-shareable (staff read this over the phone / paste into an email
  // themselves), not just a machine-only secret — there is no transactional
  // email wired up in this MVP, so the inviting staff member communicates
  // this out of band. See README "What's implemented as an extension point".
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export async function POST(req: Request) {
  const { run, tenantId, user } = await requireStaffContext();
  const { clientId, email } = await req.json();

  if (!clientId || !email) {
    return NextResponse.json({ error: "Client and email are required." }, { status: 400 });
  }
  const normalizedEmail = String(email).trim().toLowerCase();
  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);

  try {
    await withSystem(async (sql) => {
      const existing = await sql`select id from users where email = ${normalizedEmail}`;
      let userId: string;
      if (existing.length) {
        userId = existing[0].id;
      } else {
        const [created] = await sql`
          insert into users (email, password_hash, full_name)
          values (${normalizedEmail}, ${passwordHash}, ${normalizedEmail.split("@")[0]})
          returning id
        `;
        userId = created.id;
      }
      await sql`
        insert into tenant_memberships (tenant_id, user_id, is_client, client_id)
        values (${tenantId}, ${userId}, true, ${clientId})
        on conflict (tenant_id, user_id) do update set is_client = true, client_id = ${clientId}
      `;
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Could not invite this client." }, { status: 500 });
  }

  await run(
    (tx) =>
      tx`select write_audit_log(${tenantId}, ${user.id}, 'client_portal.invited', 'client', ${clientId}, null, ${JSON.stringify({ email: normalizedEmail })}::jsonb)`
  );

  return NextResponse.json({ email: normalizedEmail, tempPassword });
}
