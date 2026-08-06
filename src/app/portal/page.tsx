import Link from "next/link";
import { requirePortalContext } from "@/lib/tenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { STATUS_COLOR, STATUS_LABEL, formatDate } from "@/lib/utils";

export default async function PortalHomePage() {
  const { run, clientId } = await requirePortalContext();

  const engagements = await run(
    (tx) => tx`
      select id, title, status, due_date from engagements
      where client_id = ${clientId} order by due_date asc nulls last
    `
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-neutral-900">Welcome back</h1>
        <p className="text-sm text-neutral-700">Here&apos;s the status of your filings.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Filings</CardTitle>
          <Link href="/portal/documents">
            <Button size="sm">Upload documents</Button>
          </Link>
        </CardHeader>
        <CardContent className="space-y-3">
          {!engagements.length && <p className="text-sm text-neutral-700">Nothing on file yet.</p>}
          {engagements.map((e: any) => (
            <div key={e.id} className="flex items-center justify-between rounded-md border border-neutral-200 p-3">
              <div>
                <p className="text-sm font-medium text-neutral-900">{e.title}</p>
                <p className="text-xs text-neutral-700">Due {formatDate(e.due_date)}</p>
              </div>
              <Badge color={STATUS_COLOR[e.status]}>{STATUS_LABEL[e.status]}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
