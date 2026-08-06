import Image from "next/image";
import { requireStaffContext } from "@/lib/tenant";
import { updateTenantBranding } from "@/app/actions/settings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default async function SettingsPage() {
  const { run, tenantId } = await requireStaffContext();
  const rows = await run((tx) => tx`select * from tenants where id = ${tenantId}`);
  const tenant = rows[0];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-neutral-900">Settings</h1>
        <p className="text-sm text-neutral-700">Firm profile and branding</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Firm Branding</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateTenantBranding} className="space-y-4">
            <div>
              <Label htmlFor="name">Firm name</Label>
              <Input id="name" name="name" defaultValue={tenant?.name} required />
            </div>
            <div>
              <Label htmlFor="accent_color">Accent colour</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="accent_color"
                  name="accent_color"
                  defaultValue={tenant?.accent_color || "#2F5496"}
                  pattern="^#([0-9A-Fa-f]{6})$"
                  className="w-32 font-mono"
                />
                <span
                  className="h-9 w-9 rounded-md border border-neutral-200"
                  style={{ backgroundColor: tenant?.accent_color || "#2F5496" }}
                />
              </div>
              <p className="mt-1 text-xs text-neutral-400">
                Must meet a 4.5:1 contrast ratio against white (checked automatically on save), per the Taxus
                design system's accessibility standard.
              </p>
            </div>
            <Button type="submit">Save changes</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-3 text-sm text-neutral-700">
          <span>Taxus is a product by</span>
          <Image src="/logo-halool.png" alt="HALOOL (Private) Limited" width={90} height={22} />
        </CardContent>
      </Card>
    </div>
  );
}
