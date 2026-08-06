"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaffContext } from "@/lib/tenant";
import { withSystem } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";

export async function createClient(formData: FormData) {
  const { run, tenantId, user } = await requireStaffContext();

  const legal_name = String(formData.get("legal_name") || "").trim();
  const ntn = String(formData.get("ntn") || "").trim() || null;
  const taxpayer_type = String(formData.get("taxpayer_type") || "individual");
  const email = String(formData.get("email") || "").trim() || null;
  const phone = String(formData.get("phone") || "").trim() || null;

  if (!legal_name) throw new Error("Client legal name is required.");

  const rows = await run(
    (tx) => tx`
      insert into clients (tenant_id, legal_name, ntn, taxpayer_type, email, phone)
      values (${tenantId}, ${legal_name}, ${ntn}, ${taxpayer_type}, ${email}, ${phone})
      returning id
    `
  );
  const clientId = rows[0].id as string;

  await run(
    (tx) => tx`select write_audit_log(${tenantId}, ${user.id}, 'client.created', 'client', ${clientId}, null, ${JSON.stringify({ legal_name, ntn })}::jsonb)`
  );

  revalidatePath("/app/clients");
  redirect(`/app/clients/${clientId}`);
}

export async function archiveClient(clientId: string) {
  const { run, tenantId, user } = await requireStaffContext();

  await run(
    (tx) => tx`update clients set archived_at = now() where id = ${clientId} and tenant_id = ${tenantId}`
  );
  await run(
    (tx) => tx`select write_audit_log(${tenantId}, ${user.id}, 'client.archived', 'client', ${clientId}, null, null)`
  );

  revalidatePath("/app/clients");
}
