import { getStore } from "@netlify/blobs";

// Netlify Blobs — zero-config object storage built into the platform,
// used here for document/file bytes (SRS Volume 5, Chapter 6: Storage).
// Metadata (file name, category, extraction status, etc.) lives in Postgres
// (the `documents` table); this module only ever moves bytes.
//
// Access control is NOT enforced by Blobs itself — there is no per-object
// ACL like Supabase Storage's RLS-backed policies. Every read/write in this
// codebase goes through a server-side function that has already checked the
// caller's session and tenant scope (see src/app/api and src/app/actions),
// so a document's blob key is never handed to the browser directly, and the
// key itself is namespaced by tenant id as an extra layer of accident-proofing.

const STORE_NAME = "tenant-documents";

function store() {
  return getStore({ name: STORE_NAME, consistency: "strong" });
}

export function buildBlobKey(tenantId: string, engagementId: string | null, fileName: string) {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${tenantId}/${engagementId ?? "unfiled"}/${Date.now()}-${safeName}`;
}

export async function uploadBlob(key: string, data: ArrayBuffer | Blob, contentType?: string) {
  await store().set(key, data, contentType ? { metadata: { contentType } } : undefined);
}

export async function downloadBlob(key: string): Promise<{ data: ArrayBuffer; contentType?: string } | null> {
  const s = store();
  const result = await s.getWithMetadata(key, { type: "arrayBuffer" });
  if (!result) return null;
  return { data: result.data as ArrayBuffer, contentType: (result.metadata?.contentType as string) || undefined };
}

export async function deleteBlob(key: string) {
  await store().delete(key);
}
