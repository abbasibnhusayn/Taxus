import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus, Archive } from "lucide-react";
import { requireStaffContext } from "@/lib/tenant";
import { archiveClient } from "@/app/actions/clients";
import { InvitePortalForm } from "@/components/clients/invite-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { STATUS_COLOR, STATUS_LABEL, formatDate } from "@/lib/utils";

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const { run, tenantId } = await requireStaffContext();

  const clientRows = await run(
    (tx) => tx`select * from clients where id = ${params.id} and tenant_id = ${tenantId}`
  );
  const client = clientRows[0];
  if (!client) notFound();

  const engagements = await run(
    (tx) => tx`
      select id, title, status, due_date from engagements
      where client_id = ${params.id} order by created_at desc
    `
  );

  const archiveWithId = archiveClient.bind(null, client.id);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-neutral-900">{client.legal_name}</h1>
          <p className="text-sm text-neutral-700">
            {client.taxpayer_type.toUpperCase()} &middot; NTN: {client.ntn || "\u2014"}
          </p>
        </div>
        <form action={archiveWithId}>
          <Button type="submit" variant="secondary" size="sm">
            <Archive className="h-4 w-4" /> Archive
          </Button>
        </form>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-neutral-700">Email: </span>
              {client.email || "\u2014"}
            </p>
            <p>
              <span className="text-neutral-700">Phone: </span>
              {client.phone || "\u2014"}
            </p>
            <p>
              <span className="text-neutral-700">Address: </span>
              {client.address || "\u2014"}
            </p>
            <p>
              <span className="text-neutral-700">Client since: </span>
              {formatDate(client.created_at)}
            </p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Client Portal</CardTitle>
          </CardHeader>
          <CardContent>
            <InvitePortalForm clientId={client.id} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Engagements</CardTitle>
            <Link href={`/app/engagements/new?client_id=${client.id}`}>
              <Button size="sm">
                <Plus className="h-4 w-4" /> New
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {!engagements.length && <p className="text-sm text-neutral-700">No engagements yet.</p>}
            {engagements.map((e: any) => (
              <Link
                key={e.id}
                href={`/app/engagements/${e.id}`}
                className="flex items-center justify-between rounded-md border border-neutral-200 p-3 hover:bg-neutral-100"
              >
                <span className="text-sm font-medium text-neutral-900">{e.title}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-neutral-700">{formatDate(e.due_date)}</span>
                  <Badge color={STATUS_COLOR[e.status]}>{STATUS_LABEL[e.status]}</Badge>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
