import { requirePortalContext } from "@/lib/tenant";
import { DocumentUploadForm } from "@/components/documents/upload-form";
import { uploadDocumentAsClient } from "@/app/actions/documents";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

export default async function PortalDocumentsPage() {
  const { run, tenantId, clientId } = await requirePortalContext();

  const [documents, categories] = await Promise.all([
    run(
      (tx) => tx`
        select d.id, d.file_name, d.created_at, dc.name as category_name
        from documents d left join document_categories dc on dc.id = d.category_id
        where d.client_id = ${clientId}
        order by d.created_at desc
      `
    ),
    run((tx) => tx`select id, name from document_categories where tenant_id = ${tenantId}`),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-neutral-900">Your Documents</h1>
        <p className="text-sm text-neutral-700">Upload the documents your accountant has requested.</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <DocumentUploadForm clientId={clientId} categories={categories} action={uploadDocumentAsClient} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Uploaded so far</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {!documents.length && <p className="text-sm text-neutral-700">Nothing uploaded yet.</p>}
          {documents.map((d: any) => (
            <div key={d.id} className="flex items-center justify-between border-t border-neutral-200 pt-2 text-sm first:border-0 first:pt-0">
              <span className="font-medium text-neutral-900">{d.file_name}</span>
              <span className="text-xs text-neutral-400">
                {d.category_name || "Uncategorized"} &middot; {formatDate(d.created_at)}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
