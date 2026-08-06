import { createEngagement } from "@/app/actions/engagements";
import { requireStaffContext } from "@/lib/tenant";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export default async function NewEngagementPage({
  searchParams,
}: {
  searchParams: { client_id?: string };
}) {
  const { run, tenantId } = await requireStaffContext();
  const clients = await run(
    (tx) => tx`
      select id, legal_name from clients
      where tenant_id = ${tenantId} and archived_at is null
      order by legal_name
    `
  );

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="font-heading text-2xl font-semibold text-neutral-900">New Engagement</h1>
      <Card>
        <CardContent className="pt-6">
          <form action={createEngagement} className="space-y-4">
            <div>
              <Label htmlFor="client_id">Client</Label>
              <Select id="client_id" name="client_id" required defaultValue={searchParams.client_id || ""}>
                <option value="" disabled>
                  Select a client
                </option>
                {clients.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.legal_name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="title">Engagement title</Label>
              <Input id="title" name="title" required placeholder="FY2025 Income Tax Return" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Type</Label>
                <Select id="type" name="type" defaultValue="income_tax_return">
                  <option value="income_tax_return">Income Tax Return</option>
                  <option value="sales_tax_return">Sales Tax Return</option>
                  <option value="wealth_statement">Wealth Statement</option>
                  <option value="advisory">Advisory</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="tax_year">Tax year</Label>
                <Input id="tax_year" name="tax_year" placeholder="2025" />
              </div>
            </div>
            <div>
              <Label htmlFor="due_date">Due date</Label>
              <Input id="due_date" name="due_date" type="date" />
            </div>
            <Button type="submit" className="w-full">
              Create engagement
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
