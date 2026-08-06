import { FileText } from "lucide-react";
import { requireStaffContext } from "@/lib/tenant";
import { DocumentUploadForm } from "@/components/documents/upload-form";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, Thead, Th, Tr, Td } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export default async function DocumentsPage() {
  const { run, tenantId } = await requireStaffContext();

  const [documents, categories] = await Promise.all([
    run(
      (tx) => tx`
        select d.id, d.file_name, d.extraction_status, d.created_at,
               e.title as engagement_title, dc.name as category_name
        from documents d
        left join engagements e on e.id = d.engagement_id
        left join document_categories dc on dc.id = d.category_id
        where d.tenant_id = ${tenantId}
        order by d.created_at desc
        limit 100
      `
    ),
    run((tx) => tx`select id, name from document_categories where tenant_id = ${tenantId}`),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-neutral-900">Documents</h1>
        <p className="text-sm text-neutral-700">Firm-wide document library</p>
      </div>

      <DocumentUploadForm categories={categories} />

      {!documents.length ? (
        <EmptyState icon={FileText} title="No documents yet" description="Upload a document to get started." />
      ) : (
        <Table>
          <Thead>
            <tr>
              <Th>File</Th>
              <Th>Category</Th>
              <Th>Engagement</Th>
              <Th>Extraction</Th>
              <Th>Uploaded</Th>
            </tr>
          </Thead>
          <tbody>
            {documents.map((d: any) => (
              <Tr key={d.id}>
                <Td className="font-medium text-neutral-900">{d.file_name}</Td>
                <Td>{d.category_name || "Uncategorized"}</Td>
                <Td>{d.engagement_title || "\u2014"}</Td>
                <Td>
                  <Badge color={d.extraction_status === "done" ? "success" : "neutral"}>
                    {d.extraction_status}
                  </Badge>
                </Td>
                <Td>{formatDate(d.created_at)}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
