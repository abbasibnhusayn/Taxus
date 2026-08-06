import Link from "next/link";
import { Plus, Briefcase } from "lucide-react";
import { requireStaffContext } from "@/lib/tenant";
import { Button } from "@/components/ui/button";
import { Table, Thead, Th, Tr, Td } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { STATUS_COLOR, STATUS_LABEL, formatDate } from "@/lib/utils";

export default async function EngagementsPage() {
  const { run, tenantId } = await requireStaffContext();
  const engagements = await run(
    (tx) => tx`
      select e.id, e.title, e.status, e.due_date, e.tax_year, c.legal_name as client_name
      from engagements e join clients c on c.id = e.client_id
      where e.tenant_id = ${tenantId}
      order by e.created_at desc
    `
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-neutral-900">Engagements</h1>
          <p className="text-sm text-neutral-700">{engagements.length} engagements</p>
        </div>
        <Link href="/app/engagements/new">
          <Button>
            <Plus className="h-4 w-4" /> New Engagement
          </Button>
        </Link>
      </div>

      {!engagements.length ? (
        <EmptyState
          icon={Briefcase}
          title="No engagements yet"
          description="Create an engagement against a client to start tracking a filing."
        />
      ) : (
        <Table>
          <Thead>
            <tr>
              <Th>Engagement</Th>
              <Th>Client</Th>
              <Th>Tax Year</Th>
              <Th>Status</Th>
              <Th>Due Date</Th>
            </tr>
          </Thead>
          <tbody>
            {engagements.map((e: any) => (
              <Tr key={e.id}>
                <Td>
                  <Link href={`/app/engagements/${e.id}`} className="font-medium text-primary-700 hover:underline">
                    {e.title}
                  </Link>
                </Td>
                <Td>{e.client_name}</Td>
                <Td className="font-mono text-xs">{e.tax_year || "\u2014"}</Td>
                <Td>
                  <Badge color={STATUS_COLOR[e.status]}>{STATUS_LABEL[e.status]}</Badge>
                </Td>
                <Td>{formatDate(e.due_date)}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
