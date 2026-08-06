import { requireStaffContext } from "@/lib/tenant";
import { ChatPanel } from "@/components/assistant/chat-panel";

export default async function AssistantPage({
  searchParams,
}: {
  searchParams: { engagement_id?: string };
}) {
  const { run, tenantId } = await requireStaffContext();

  let scopeLabel = "Your firm (general)";
  const engagementId = searchParams.engagement_id;

  if (engagementId) {
    const rows = await run(
      (tx) => tx`
        select e.title, c.legal_name as client_name
        from engagements e join clients c on c.id = e.client_id
        where e.id = ${engagementId} and e.tenant_id = ${tenantId}
      `
    );
    if (rows[0]) scopeLabel = `${rows[0].client_name} \u2013 ${rows[0].title}`;
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-neutral-900">Tax Assistant</h1>
        <p className="text-sm text-neutral-700">Grounded in your firm&apos;s own data. Always review before relying on it.</p>
      </div>
      <ChatPanel
        initialMessages={[]}
        scopeType={engagementId ? "engagement" : "firm"}
        scopeId={engagementId}
        scopeLabel={scopeLabel}
      />
    </div>
  );
}
