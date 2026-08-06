"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { withUser } from "@/lib/db";

export async function markNotificationRead(notificationId: string) {
  const session = await getSession();
  if (!session) return;
  await withUser(session.userId, (tx) =>
    tx`update notifications set read_at = now() where id = ${notificationId} and user_id = ${session.userId}`
  );
  revalidatePath("/app/notifications");
}

export async function markAllNotificationsRead() {
  const session = await getSession();
  if (!session) return;
  await withUser(session.userId, (tx) =>
    tx`update notifications set read_at = now() where user_id = ${session.userId} and read_at is null`
  );
  revalidatePath("/app/notifications");
}
