import { redirect } from "next/navigation";
import type postgres from "postgres";
import { getSession } from "@/lib/auth/session";
import { withUser, withTenant } from "@/lib/db";

type Runner = <T>(fn: (tx: postgres.TransactionSql) => Promise<T>) => Promise<T>;

/**
 * Resolves the current user's active staff tenant and returns everything a
 * server component/action typically needs: the authenticated user, their
 * tenant id, and a `run` helper that executes tenant-and-user-scoped,
 * RLS-enforced queries (see withTenant in lib/db.ts).
 *
 * For MVP, a user's first non-client membership is used as their active
 * tenant; Volume 2 Ch.9.7's tenant switcher is a natural extension point
 * once a user belongs to more than one firm.
 */
export async function requireStaffContext() {
  const session = await getSession();
  if (!session) redirect("/login");

  const memberships = await withUser(session.userId, (tx) =>
    tx`select tenant_id from tenant_memberships
       where user_id = ${session.userId} and is_client = false
       limit 1`
  );

  if (!memberships.length) redirect("/signup");
  const tenantId = memberships[0].tenant_id as string;

  const run: Runner = (fn) => withTenant(tenantId, session.userId, fn);

  return {
    user: { id: session.userId, email: session.email, fullName: session.fullName },
    tenantId,
    run,
  };
}

export async function requirePortalContext() {
  const session = await getSession();
  if (!session) redirect("/login");

  const memberships = await withUser(session.userId, (tx) =>
    tx`select tenant_id, client_id from tenant_memberships
       where user_id = ${session.userId} and is_client = true
       limit 1`
  );

  if (!memberships.length) redirect("/app/dashboard"); // staff user, not a client
  const tenantId = memberships[0].tenant_id as string;
  const clientId = memberships[0].client_id as string;

  const run: Runner = (fn) => withTenant(tenantId, session.userId, fn);

  return {
    user: { id: session.userId, email: session.email, fullName: session.fullName },
    tenantId,
    clientId,
    run,
  };
}
