import { Bell, BellOff } from "lucide-react";
import { requireStaffContext } from "@/lib/tenant";
import { markNotificationRead, markAllNotificationsRead } from "@/app/actions/notifications";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";

export default async function NotificationsPage() {
  const { run, user } = await requireStaffContext();
  const notifications = await run(
    (tx) => tx`
      select * from notifications where user_id = ${user.id}
      order by created_at desc limit 50
    `
  );

  async function markReadAction(formData: FormData) {
    "use server";
    await markNotificationRead(String(formData.get("notification_id")));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-neutral-900">Notifications</h1>
          <p className="text-sm text-neutral-700">Deadlines, AI flags, and system activity</p>
        </div>
        <form action={markAllNotificationsRead}>
          <Button type="submit" variant="secondary" size="sm">
            Mark all read
          </Button>
        </form>
      </div>

      {!notifications.length ? (
        <EmptyState icon={BellOff} title="No notifications" description="You're all caught up." />
      ) : (
        <div className="space-y-2">
          {notifications.map((n: any) => (
            <Card key={n.id} className={!n.read_at ? "border-primary-500/40 bg-primary-100/30" : ""}>
              <CardContent className="flex items-start justify-between gap-4 pt-4">
                <div className="flex items-start gap-3">
                  <Bell className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{n.title}</p>
                    {n.body && <p className="text-sm text-neutral-700">{n.body}</p>}
                    <p className="mt-1 text-xs text-neutral-400">{formatDate(n.created_at)}</p>
                  </div>
                </div>
                {!n.read_at && (
                  <form action={markReadAction}>
                    <input type="hidden" name="notification_id" value={n.id} />
                    <Button type="submit" size="sm" variant="ghost">
                      Mark read
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
