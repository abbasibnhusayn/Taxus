"use server";

import { revalidatePath } from "next/cache";
import { requireStaffContext } from "@/lib/tenant";

export async function logTime(formData: FormData) {
  const { run, tenantId, user } = await requireStaffContext();

  const engagement_id = String(formData.get("engagement_id") || "");
  const minutes = Number(formData.get("minutes") || 0);
  const description = String(formData.get("description") || "").trim() || null;

  if (!engagement_id || minutes <= 0) throw new Error("Engagement and a positive duration are required.");

  await run(
    (tx) => tx`
      insert into time_entries (tenant_id, engagement_id, user_id, minutes, description)
      values (${tenantId}, ${engagement_id}, ${user.id}, ${minutes}, ${description})
    `
  );

  revalidatePath("/app/billing");
}

export async function createInvoiceFromTimeEntries(clientId: string, engagementId: string) {
  const { run, tenantId, user } = await requireStaffContext();

  const entries = await run(
    (tx) => tx`
      select id, minutes, description from time_entries
      where tenant_id = ${tenantId} and engagement_id = ${engagementId}
        and billable = true and invoiced = false
    `
  );
  if (!entries.length) throw new Error("No unbilled time entries for this engagement.");

  const RATE_PER_HOUR = 5000; // PKR — firm-configurable rate is a Settings extension point.
  const lineItems = entries.map((e: any) => ({
    description: e.description || "Professional services",
    amount: Math.round((e.minutes / 60) * RATE_PER_HOUR),
  }));
  const total = lineItems.reduce((sum, li) => sum + li.amount, 0);
  const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;

  const invoiceId = await run(async (tx) => {
    const [invoice] = await tx`
      insert into invoices (tenant_id, client_id, engagement_id, invoice_number, status, total_amount, created_by)
      values (${tenantId}, ${clientId}, ${engagementId}, ${invoiceNumber}, 'draft', ${total}, ${user.id})
      returning id
    `;
    for (const li of lineItems) {
      await tx`
        insert into invoice_line_items (tenant_id, invoice_id, description, amount, source_type)
        values (${tenantId}, ${invoice.id}, ${li.description}, ${li.amount}, 'time_entry')
      `;
    }
    await tx`
      update time_entries set invoiced = true
      where id in ${tx(entries.map((e: any) => e.id))}
    `;
    return invoice.id as string;
  });

  revalidatePath("/app/billing");
  return invoiceId;
}

export async function sendInvoice(invoiceId: string) {
  const { run, tenantId } = await requireStaffContext();
  await run(
    (tx) => tx`
      update invoices set status = 'sent', issued_at = current_date
      where id = ${invoiceId} and tenant_id = ${tenantId}
    `
  );
  revalidatePath("/app/billing");
}
