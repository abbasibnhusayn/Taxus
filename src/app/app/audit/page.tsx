import { ShieldCheck } from "lucide-react";
import { requireStaffContext } from "@/lib/tenant";
import { Table, Thead, Th, Tr, Td } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";

export default async function AuditTrailPage() {
  const { run, tenantId } = await requireStaffContext();
  const entries = await run(
    (tx) => tx`
      select a.id, a.action, a.entity_type, a.created_at, u.full_name as actor_name
      from audit_log a
      left join users u on u.id = a.actor_id
      where a.tenant_id = ${tenantId}
      order by a.created_at desc
      limit 200
    `
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-neutral-900">Audit Trail</h1>
        <p className="text-sm text-neutral-700">Append-only record of significant actions across your firm&apos;s workspace</p>
      </div>

      {!entries.length ? (
        <EmptyState icon={ShieldCheck} title="No audit activity yet" />
      ) : (
        <Table>
          <Thead>
            <tr>
              <Th>Action</Th>
              <Th>Entity</Th>
              <Th>Actor</Th>
              <Th>When</Th>
            </tr>
          </Thead>
          <tbody>
            {entries.map((e: any) => (
              <Tr key={e.id}>
                <Td className="font-mono text-xs">{e.action}</Td>
                <Td>{e.entity_type}</Td>
                <Td>{e.actor_name || "System"}</Td>
                <Td>{formatDate(e.created_at)}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
