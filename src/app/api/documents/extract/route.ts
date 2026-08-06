import { NextResponse } from "next/server";
import type postgres from "postgres";
import { getSession } from "@/lib/auth/session";
import { withUser, withTenant } from "@/lib/db";
import { downloadBlob } from "@/lib/blobs";
import { extractDocumentFields } from "@/lib/ai/gateway";

// POST /api/documents/extract  { documentId: string }
// Implements the OCR/document-intelligence extraction step described in SRS
// Volume 3 Ch.6 and Volume 4 Ch.7, using Claude's vision capability as the
// extraction model behind the AI Gateway abstraction (Volume 4 Ch.2).
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { documentId } = await req.json();
  if (!documentId) return NextResponse.json({ error: "documentId is required." }, { status: 400 });

  const memberships = await withUser(session.userId, (tx) =>
    tx`select tenant_id from tenant_memberships where user_id = ${session.userId} and is_client = false limit 1`
  );
  if (!memberships.length) return NextResponse.json({ error: "No active workspace." }, { status: 403 });
  const tenantId = memberships[0].tenant_id as string;
  const run = <T,>(fn: (tx: postgres.TransactionSql) => Promise<T>) => withTenant<T>(tenantId, session.userId, fn);

  // RLS ensures this only returns a row if the document belongs to this tenant.
  const docRows = await run(
    (tx) => tx`
      select d.id, d.blob_key, d.mime_type, d.file_name, dc.name as category_name
      from documents d left join document_categories dc on dc.id = d.category_id
      where d.id = ${documentId} and d.tenant_id = ${tenantId}
    `
  );
  const doc = docRows[0];
  if (!doc) return NextResponse.json({ error: "Document not found or not accessible." }, { status: 404 });

  const supportedTypes = ["image/png", "image/jpeg", "image/webp", "application/pdf"];
  if (!doc.mime_type || !supportedTypes.includes(doc.mime_type)) {
    return NextResponse.json(
      { error: `Extraction supports PNG, JPEG, WEBP, and PDF only (got ${doc.mime_type}).` },
      { status: 422 }
    );
  }

  await run((tx) => tx`update documents set extraction_status = 'pending' where id = ${documentId}`);

  const blob = await downloadBlob(doc.blob_key);
  if (!blob) {
    await run((tx) => tx`update documents set extraction_status = 'failed' where id = ${documentId}`);
    return NextResponse.json({ error: "Could not read the stored file." }, { status: 500 });
  }

  const base64Data = Buffer.from(blob.data).toString("base64");

  try {
    const { fields, rawText } = await extractDocumentFields({
      base64Data,
      mediaType: doc.mime_type as any,
      documentCategory: doc.category_name || "Unclassified tax document",
    });

    const overallConfidence =
      fields.length > 0 ? fields.reduce((s, f) => s + f.confidence, 0) / fields.length : 0;

    await run(
      (tx) => tx`
        update documents set
          extraction_status = 'done',
          extracted_fields = ${JSON.stringify({ fields, raw_text: rawText })}::jsonb,
          extraction_confidence = ${overallConfidence}
        where id = ${documentId}
      `
    );

    return NextResponse.json({ fields, confidence: overallConfidence });
  } catch (e: any) {
    await run((tx) => tx`update documents set extraction_status = 'failed' where id = ${documentId}`);
    return NextResponse.json(
      { error: e?.message ?? "Extraction failed. Is GEMINI_API_KEY configured?" },
      { status: 502 }
    );
  }
}
