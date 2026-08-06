import Link from "next/link";
import { Briefcase, Users, AlertTriangle, Clock } from "lucide-react";
import { requireStaffContext } from "@/lib/tenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, STATUS_COLOR, STATUS_LABEL } from "@/lib/utils";

export default async function DashboardPage() {
  const { run, tenantId } = await requireStaffContext();

  const [clientCountRows, engagementCountRows, dueSoon, openFlags] = await Promise.all([
    run((tx) => tx`select count(*)::int as count from clients where tenant_id = ${tenantId} and archived_at is null`),
    run(
      (tx) =>
        tx`select count(*)::int as count from engagements where tenant_id = ${tenantId} and status not in ('archived','acknowledged')`
    ),
    run(
      (tx) => tx`
        select e.id, e.title, e.status, e.due_date, c.legal_name as client_name
        from engagements e join clients c on c.id = e.client_id
        where e.tenant_id = ${tenantId} and e.status not in ('archived','acknowledged','filed')
        order by e.due_date asc nulls last
        limit 6
      `
    ),
    run(
      (tx) => tx`
        select f.id, f.flag_type, f.severity, f.engagement_id, e.title as engagement_title
        from compliance_flags f join engagements e on e.id = f.engagement_id
        where f.tenant_id = ${tenantId} and f.status = 'open'
        order by case f.severity when 'high' then 0 when 'medium' then 1 else 2 end
        limit 6
      `
    ),
  ]);

  const kpis = [
    { label: "Active Clients", value: clientCountRows[0]?.count ?? 0, icon: Users },
    { label: "Open Engagements", value: engagementCountRows[0]?.count ?? 0, icon: Briefcase },
    { label: "Open Compliance Flags", value: openFlags.length, icon: AlertTriangle },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-neutral-900">Dashboard</h1>
        <p className="text-sm text-neutral-700">An overview of your firm&apos;s active work.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="flex items-center justify-between pt-6">
              <div>
                <p className="text-sm text-neutral-700">{k.label}</p>
                <p className="mt-1 font-mono text-2xl font-semibold text-neutral-900">{k.value}</p>
              </div>
              <k.icon className="h-8 w-8 text-primary-700" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-status-warning" /> Deadline Radar
            </CardTitle>
            <Link href="/app/engagements" className="text-xs font-medium text-primary-700 hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {!dueSoon.length && <p className="text-sm text-neutral-700">Nothing due soon. You&apos;re clear.</p>}
            {dueSoon.map((e: any) => (
              <Link
                key={e.id}
                href={`/app/engagements/${e.id}`}
                className="flex items-center justify-between rounded-md border border-neutral-200 p-3 hover:bg-neutral-100"
              >
                <div>
                  <p className="text-sm font-medium text-neutral-900">{e.title}</p>
                  <p className="text-xs text-neutral-700">{e.client_name}</p>
                </div>
                <div className="text-right">
                  <Badge color={STATUS_COLOR[e.status]}>{STATUS_LABEL[e.status]}</Badge>
                  <p className="mt-1 text-xs text-neutral-700">{formatDate(e.due_date)}</p>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-status-danger" /> Compliance Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!openFlags.length && <p className="text-sm text-neutral-700">No open compliance flags.</p>}
            {openFlags.map((f: any) => (
              <Link
                key={f.id}
                href={`/app/engagements/${f.engagement_id}`}
                className="flex items-center justify-between rounded-md border border-neutral-200 p-3 hover:bg-neutral-100"
              >
                <div>
                  <p className="text-sm font-medium text-neutral-900">{f.flag_type}</p>
                  <p className="text-xs text-neutral-700">{f.engagement_title}</p>
                </div>
                <Badge color={f.severity === "high" ? "danger" : f.severity === "medium" ? "warning" : "neutral"}>
                  {f.severity}
                </Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
