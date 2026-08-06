import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { requireStaffContext } from "@/lib/tenant";
import { Button } from "@/components/ui/button";
import { Table, Thead, Th, Tr, Td } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";

export default async function ClientsPage() {
  const { run, tenantId } = await requireStaffContext();
  const clients = await run(
    (tx) => tx`
      select id, legal_name, ntn, taxpayer_type, email, created_at
      from clients where tenant_id = ${tenantId} and archived_at is null
      order by created_at desc
    `
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-neutral-900">Clients</h1>
          <p className="text-sm text-neutral-700">{clients.length} active clients</p>
        </div>
        <Link href="/app/clients/new">
          <Button>
            <Plus className="h-4 w-4" /> New Client
          </Button>
        </Link>
      </div>

      {!clients.length ? (
        <EmptyState
          icon={Users}
          title="No clients yet"
          description="Add your first client to start creating engagements."
          action={
            <Link href="/app/clients/new">
              <Button size="sm">
                <Plus className="h-4 w-4" /> New Client
              </Button>
            </Link>
          }
        />
      ) : (
        <Table>
          <Thead>
            <tr>
              <Th>Legal Name</Th>
              <Th>NTN</Th>
              <Th>Type</Th>
              <Th>Email</Th>
            </tr>
          </Thead>
          <tbody>
            {clients.map((c: any) => (
              <Tr key={c.id}>
                <Td>
                  <Link href={`/app/clients/${c.id}`} className="font-medium text-primary-700 hover:underline">
                    {c.legal_name}
                  </Link>
                </Td>
                <Td className="font-mono text-xs">{c.ntn || "\u2014"}</Td>
                <Td className="capitalize">{c.taxpayer_type}</Td>
                <Td>{c.email || "\u2014"}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
