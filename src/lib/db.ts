import postgres from "postgres";

// Netlify Database connection. NETLIFY_DB_URL is provisioned and injected
// automatically by Netlify for every build, function, and edge function once
// @netlify/database is installed and a migration has been deployed — see
// DEPLOYMENT.md. For local development, `netlify dev` provides the same
// variable backed by a local Postgres instance (see "Local development" in
// the Netlify Database docs).
const connectionString = process.env.NETLIFY_DB_URL || process.env.DATABASE_URL;

if (!connectionString && process.env.NODE_ENV !== "test") {
  // Don't throw at import time — Next.js imports this module during the
  // build's static analysis pass, before env vars are necessarily present.
  // Callers get a clear error the moment they actually try to query.
  console.warn(
    "[taxus] NETLIFY_DB_URL is not set. Database calls will fail until this is configured (see DEPLOYMENT.md)."
  );
}

// A small connection pool. Netlify Functions are short-lived, so `postgres`'s
// default lazy-connect + idle-timeout behaviour is appropriate here — it
// will not hold connections open across invocations.
const sql = postgres(connectionString ?? "", {
  ssl: connectionString?.includes("localhost") ? false : "require",
  max: 5,
  idle_timeout: 20,
  connect_timeout: 10,
});

export { sql };

/**
 * Runs `fn` inside a transaction with Postgres session variables
 * (app.tenant_id, app.user_id) set for the duration of that transaction, so
 * every Row-Level Security policy defined in
 * netlify/database/migrations/0002_functions_and_workflow/migration.sql
 * automatically scopes every query to the current tenant — even if a query
 * inside `fn` forgets an explicit `where tenant_id = ...` clause.
 *
 * This is the plain-Postgres equivalent of what Supabase's auth.uid()-driven
 * RLS gave us for free; see README "Security model" for the full explanation.
 */
export async function withTenant<T>(
  tenantId: string,
  userId: string,
  fn: (tx: postgres.TransactionSql) => Promise<T>
): Promise<T> {
  return sql.begin(async (tx) => {
    await tx`select set_config('app.tenant_id', ${tenantId}, true), set_config('app.user_id', ${userId}, true)`;
    return fn(tx);
  });
}

/**
 * Like withTenant, but for requests that are only identified by user (e.g.
 * resolving which tenant a just-authenticated user belongs to) and have no
 * tenant context yet. RLS policies on `users` still apply (a user can always
 * read their own row); tenant-scoped tables will simply return no rows,
 * which is correct — there is no tenant context yet.
 */
export async function withUser<T>(
  userId: string,
  fn: (tx: postgres.TransactionSql) => Promise<T>
): Promise<T> {
  return sql.begin(async (tx) => {
    await tx`select set_config('app.user_id', ${userId}, true)`;
    return fn(tx);
  });
}

/**
 * Runs `fn` with NO tenant/user context — relies entirely on the
 * SECURITY DEFINER functions (provision_tenant, write_audit_log) or on
 * queries that are safe to run unscoped (e.g. looking up a user by email
 * during login, before we know who they are). Never use this for arbitrary
 * application queries.
 */
export async function withSystem<T>(fn: (tx: postgres.Sql) => Promise<T>): Promise<T> {
  return fn(sql);
}
