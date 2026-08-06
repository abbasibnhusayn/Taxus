import { Receipt } from "lucide-react";
import { requireStaffContext } from "@/lib/tenant";
import { sendInvoice, createInvoiceFromTimeEntries } from "@/app/actions/billing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, Thead, Th, Tr, Td } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDate } from "@/lib/utils";

const INVOICE_COLOR: Record<string, string> = {
  draft: "neutral",
  sent: "info",
  partially_paid: "warning",
  paid: "success",
  void: "danger",
};

export default async function BillingPage() {
  const { run, tenantId } = await requireStaffContext();

  const [invoices, unbilled] = await Promise.all([
    run(
      (tx) => tx`
        select i.id, i.invoice_number, i.status, i.total_amount, i.currency, i.issued_at,
               c.legal_name as client_name
        from invoices i join clients c on c.id = i.client_id
        where i.tenant_id = ${tenantId}
        order by i.created_at desc
      `
    ),
    run(
      (tx) => tx`
        select t.engagement_id, sum(t.minutes)::int as minutes,
               e.title as engagement_title, e.client_id, c.legal_name as client_name
        from time_entries t
        join engagements e on e.id = t.engagement_id
        join clients c on c.id = e.client_id
        where t.tenant_id = ${tenantId} and t.billable = true and t.invoiced = false
        group by t.engagement_id, e.title, e.client_id, c.legal_name
      `
    ),
  ]);

  async function createInvoiceAction(formData: FormData) {
    "use server";
    const engagementId = String(formData.get("engagement_id"));
    const clientId = String(formData.get("client_id"));
    await createInvoiceFromTimeEntries(clientId, engagementId);
  }

  async function sendInvoiceAction(formData: FormData) {
    "use server";
    await sendInvoice(String(formData.get("invoice_id")));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-neutral-900">Billing</h1>
        <p className="text-sm text-neutral-700">Time entries, invoices, and payment status</p>
      </div>

      {unbilled.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Unbilled Time \u2014 Ready to Invoice</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {unbilled.map((v: any) => (
              <form
                key={v.engagement_id}
                action={createInvoiceAction}
                className="flex items-center justify-between rounded-md border border-neutral-200 p-3"
              >
                <input type="hidden" name="engagement_id" value={v.engagement_id} />
                <input type="hidden" name="client_id" value={v.client_id} />
                <div>
                  <p className="text-sm font-medium text-neutral-900">{v.engagement_title}</p>
                  <p className="text-xs text-neutral-700">
                    {v.client_name} &middot; {(v.minutes / 60).toFixed(1)}h unbilled
                  </p>
                </div>
                <Button type="submit" size="sm">
                  Generate invoice
                </Button>
              </form>
            ))}
          </CardContent>
        </Card>
      )}

      {!invoices.length ? (
        <EmptyState icon={Receipt} title="No invoices yet" description="Invoices generated from time entries will appear here." />
      ) : (
        <Table>
          <Thead>
            <tr>
              <Th>Invoice #</Th>
              <Th>Client</Th>
              <Th>Amount</Th>
              <Th>Status</Th>
              <Th>Issued</Th>
              <Th></Th>
            </tr>
          </Thead>
          <tbody>
            {invoices.map((inv: any) => (
              <Tr key={inv.id}>
                <Td className="font-mono text-xs">{inv.invoice_number}</Td>
                <Td>{inv.client_name}</Td>
                <Td className="font-mono">{formatCurrency(inv.total_amount, inv.currency)}</Td>
                <Td>
                  <Badge color={INVOICE_COLOR[inv.status]}>{inv.status.replace("_", " ")}</Badge>
                </Td>
                <Td>{formatDate(inv.issued_at)}</Td>
                <Td>
                  {inv.status === "draft" && (
                    <form action={sendInvoiceAction}>
                      <input type="hidden" name="invoice_id" value={inv.id} />
                      <Button type="submit" size="sm" variant="secondary">
                        Send
                      </Button>
                    </form>
                  )}
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
