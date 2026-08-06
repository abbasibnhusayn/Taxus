import { requirePortalContext } from "@/lib/tenant";
import { PortalHeader } from "@/components/layout/portal-header";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const { tenantId, run } = await requirePortalContext();

  const tenantRows = await run((tx) => tx`select name, logo_url from tenants where id = ${tenantId}`);
  const tenant = tenantRows[0];

  return (
    <div className="min-h-screen bg-neutral-100">
      <PortalHeader tenantName={tenant?.name ?? "Your accountant"} logoUrl={tenant?.logo_url} />
      <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
      <footer className="py-6 text-center text-xs text-neutral-400">
        Powered by Taxus \u2014 a HALOOL (Private) Limited product
      </footer>
    </div>
  );
}
