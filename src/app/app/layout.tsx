import { requireStaffContext } from "@/lib/tenant";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, tenantId, run } = await requireStaffContext();

  const [tenantRows, unreadRows] = await Promise.all([
    run((tx) => tx`select name, logo_url from tenants where id = ${tenantId}`),
    run((tx) => tx`select count(*)::int as count from notifications where user_id = ${user.id} and read_at is null`),
  ]);

  const tenant = tenantRows[0];
  const unreadCount = unreadRows[0]?.count ?? 0;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar tenantName={tenant?.name ?? "Your firm"} logoUrl={tenant?.logo_url} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header userName={user.fullName || user.email} unreadCount={unreadCount} />
        <main className="scrollbar-thin flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
