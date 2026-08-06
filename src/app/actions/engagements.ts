"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaffContext } from "@/lib/tenant";
import type { EngagementStatus } from "@/types/database";

export async function createEngagement(formData: FormData) {
  const { run, tenantId, user } = await requireStaffContext();

  const client_id = String(formData.get("client_id") || "");
  const title = String(formData.get("title") || "").trim();
  const type = String(formData.get("type") || "income_tax_return");
  const tax_year = String(formData.get("tax_year") || "").trim() || null;
  const due_date = String(formData.get("due_date") || "").trim() || null;

  if (!client_id || !title) throw new Error("Client and title are required.");

  const rows = await run(
    (tx) => tx`
      insert into engagements (tenant_id, client_id, title, type, tax_year, due_date, status)
      values (${tenantId}, ${client_id}, ${title}, ${type}, ${tax_year}, ${due_date}, 'draft')
      returning id
    `
  );
  const engagementId = rows[0].id as string;

  await run(
    (tx) =>
      tx`select write_audit_log(${tenantId}, ${user.id}, 'engagement.created', 'engagement', ${engagementId}, null, ${JSON.stringify({ title, type })}::jsonb)`
  );

  revalidatePath("/app/engagements");
  redirect(`/app/engagements/${engagementId}`);
}

export async function updateEngagementStatus(engagementId: string, status: EngagementStatus) {
  const { run, tenantId } = await requireStaffContext();
  // The trigger on_engagement_status_change (0002 migration) logs this
  // transition to workflow_transitions_log automatically.
  await run(
    (tx) => tx`update engagements set status = ${status} where id = ${engagementId} and tenant_id = ${tenantId}`
  );
  revalidatePath(`/app/engagements/${engagementId}`);
  revalidatePath("/app/engagements");
}

export async function assignEngagement(engagementId: string, assigneeId: string) {
  const { run, tenantId } = await requireStaffContext();
  await run(
    (tx) =>
      tx`update engagements set assignee_id = ${assigneeId || null} where id = ${engagementId} and tenant_id = ${tenantId}`
  );
  revalidatePath(`/app/engagements/${engagementId}`);
}
