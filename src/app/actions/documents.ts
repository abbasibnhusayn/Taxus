"use server";

import { revalidatePath } from "next/cache";
import { requireStaffContext, requirePortalContext } from "@/lib/tenant";
import { buildBlobKey, uploadBlob } from "@/lib/blobs";

export async function uploadDocument(formData: FormData) {
  const { run, tenantId, user } = await requireStaffContext();

  const file = formData.get("file") as File | null;
  const engagement_id = String(formData.get("engagement_id") || "") || null;
  const client_id = String(formData.get("client_id") || "") || null;
  const category_id = String(formData.get("category_id") || "") || null;

  if (!file || file.size === 0) throw new Error("Choose a file to upload.");

  const blobKey = buildBlobKey(tenantId, engagement_id, file.name);
  await uploadBlob(blobKey, await file.arrayBuffer(), file.type);

  const rows = await run(
    (tx) => tx`
      insert into documents (tenant_id, engagement_id, client_id, category_id, file_name, blob_key, mime_type, size_bytes, uploaded_by)
      values (${tenantId}, ${engagement_id}, ${client_id}, ${category_id}, ${file.name}, ${blobKey}, ${file.type}, ${file.size}, ${user.id})
      returning id
    `
  );
  const documentId = rows[0].id as string;

  await run(
    (tx) =>
      tx`select write_audit_log(${tenantId}, ${user.id}, 'document.uploaded', 'document', ${documentId}, null, ${JSON.stringify({ file_name: file.name })}::jsonb)`
  );

  revalidatePath("/app/documents");
  if (engagement_id) revalidatePath(`/app/engagements/${engagement_id}`);
  return documentId;
}

// Client Portal variant — authenticates as the portal user (not staff) and
// resolves tenant/client scope from their own membership row, since a client
// contact is deliberately not a staff member (Volume 3, RBAC).
export async function uploadDocumentAsClient(formData: FormData) {
  const { run, tenantId, clientId, user } = await requirePortalContext();

  const file = formData.get("file") as File | null;
  const category_id = String(formData.get("category_id") || "") || null;
  if (!file || file.size === 0) throw new Error("Choose a file to upload.");

  const blobKey = buildBlobKey(tenantId, null, file.name);
  await uploadBlob(blobKey, await file.arrayBuffer(), file.type);

  await run(
    (tx) => tx`
      insert into documents (tenant_id, client_id, category_id, file_name, blob_key, mime_type, size_bytes, uploaded_by)
      values (${tenantId}, ${clientId}, ${category_id}, ${file.name}, ${blobKey}, ${file.type}, ${file.size}, ${user.id})
    `
  );

  revalidatePath("/portal/documents");
}
