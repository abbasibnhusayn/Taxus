import Link from "next/link";
import { notFound } from "next/navigation";
import { Sparkles, AlertTriangle } from "lucide-react";
import { requireStaffContext } from "@/lib/tenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusSelect } from "@/components/engagements/status-select";
import { DocumentUploadForm } from "@/components/documents/upload-form";
import { ExtractButton } from "@/components/documents/extract-button";
import { TimeEntryForm } from "@/components/billing/time-entry-form";
import { formatDate } from "@/lib/utils";

export default async function EngagementDetailPage({ params }: { params: { id: string } }) {
  const { run, tenantId } = await requireStaffContext();

  const engagementRows = await run(
    (tx) => tx`
      select e.*, c.id as client_id, c.legal_name as client_name
      from engagements e join clients c on c.id = e.client_id
      where e.id = ${params.id} and e.tenant_id = ${tenantId}
    `
  );
  const engagement = engagementRows[0];
  if (!engagement) notFound();

  const [documents, categories, flags, timeEntries] = await Promise.all([
    run(
      (tx) => tx`
        select id, file_name, mime_type, extraction_status, created_at
        from documents where engagement_id = ${params.id}
        order by created_at desc
      `
    ),
    run((tx) => tx`select id, name from document_categories where tenant_id = ${tenantId}`),
    run(
      (tx) => tx`select * from compliance_flags where engagement_id = ${params.id} and status = 'open'`
    ),
    run(
      (tx) => tx`
        select id, minutes, description, entry_date, invoiced
        from time_entries where engagement_id = ${params.id}
        order by entry_date desc
      `
    ),
  ]);

  const totalMinutes = timeEntries.reduce((s: number, t: any) => s + t.minutes, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-neutral-700">
            <Link href={`/app/clients/${engagement.client_id}`} className="hover:underline">
              {engagement.client_name}
            </Link>{" "}
            / Engagements / <span className="text-neutral-900">{engagement.title}</span>
          </p>
          <h1 className="font-heading text-2xl font-semibold text-neutral-900">{engagement.title}</h1>
        </div>
        <div className="flex items-center gap-3">
          <StatusSelect engagementId={engagement.id} status={engagement.status} />
          <Link href={`/app/assistant?engagement_id=${engagement.id}`}>
            <Badge color="ai">
              <Sparkles className="h-3 w-3" /> Ask Assistant
            </Badge>
          </Link>
        </div>
      </div>

      {!!flags.length && (
        <Card className="border-status-danger/40 bg-status-danger/5">
          <CardContent className="flex items-start gap-3 pt-6">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-status-danger" />
            <div>
              <p className="font-medium text-neutral-900">{flags.length} open compliance flag(s)</p>
              <ul className="mt-1 space-y-0.5 text-sm text-neutral-700">
                {flags.map((f: any) => (
                  <li key={f.id}>
                    &bull; {f.flag_type} ({f.severity})
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-neutral-700">Type: </span>
              {engagement.type.replaceAll("_", " ")}
            </p>
            <p>
              <span className="text-neutral-700">Tax year: </span>
              {engagement.tax_year || "\u2014"}
            </p>
            <p>
              <span className="text-neutral-700">Due date: </span>
              {formatDate(engagement.due_date)}
            </p>
            <p>
              <span className="text-neutral-700">Created: </span>
              {formatDate(engagement.created_at)}
            </p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DocumentUploadForm engagementId={engagement.id} categories={categories} />
            <div className="space-y-3">
              {!documents.length && <p className="text-sm text-neutral-700">No documents uploaded yet.</p>}
              {documents.map((d: any) => (
                <div key={d.id} className="rounded-md border border-neutral-200 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-neutral-900">{d.file_name}</span>
                    <span className="text-xs text-neutral-400">{formatDate(d.created_at)}</span>
                  </div>
                  {(d.mime_type?.startsWith("image/") || d.mime_type === "application/pdf") && (
                    <ExtractButton documentId={d.id} />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Time Log <span className="font-normal text-neutral-400">({(totalMinutes / 60).toFixed(1)}h total)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <TimeEntryForm engagementId={engagement.id} />
          {timeEntries.map((t: any) => (
            <div key={t.id} className="flex items-center justify-between border-t border-neutral-200 pt-2 text-sm">
              <span>{t.description || "\u2014"}</span>
              <span className="flex items-center gap-2 text-neutral-700">
                {(t.minutes / 60).toFixed(1)}h
                {t.invoiced && <Badge color="success">Invoiced</Badge>}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
