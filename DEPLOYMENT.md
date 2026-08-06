# Deploying Taxus (Netlify + GitHub only)

No Supabase, no separate database host, no separate auth provider. Just
GitHub for source control and Netlify for everything else. Follow this in
order.

## 0. Prerequisites

- A GitHub account
- A [Netlify](https://netlify.com) account
- The [Netlify CLI](https://docs.netlify.com/cli/get-started/): `npm install -g netlify-cli`
- A [Google AI Studio](https://aistudio.google.com/apikey) API key (free, no credit card)
- Node.js 18.18+ installed locally, to run the first build yourself before trusting Netlify's

---

## 1. Push the code to GitHub

```bash
git init
git add -A
git commit -m "Initial Taxus MVP"
git branch -M main
git remote add origin https://github.com/YOUR-ORG/taxus.git
git push -u origin main
```

## 2. Create the Netlify site

```bash
netlify login
netlify init
```

Choose **"Create & configure a new site"**, pick your team, and let it detect
this as a Next.js project (it will pick up `netlify.toml` automatically —
build command `npm run build`, publish `.next`, `@netlify/plugin-nextjs`
plugin). This links your local repo to a real Netlify site, which you need
before the next step.

## 3. Provision Netlify Database

```bash
netlify database init
```

This provisions a managed Postgres database for your site and wires up the
`NETLIFY_DB_URL` environment variable automatically — in Netlify's
dashboard, in `netlify dev` locally, and in every deploy. You never set this
variable by hand.

## 4. Apply the database migrations

The schema lives in `netlify/database/migrations/`. With the Netlify CLI:

```bash
netlify database migrations new init_schema
# It scaffolds netlify/database/migrations/<generated-folder>/migration.sql —
# replace its contents with netlify/database/migrations/0001_init_schema/migration.sql

netlify database migrations new functions_and_workflow
# Same thing, using netlify/database/migrations/0002_functions_and_workflow/migration.sql
```

> The exact scaffolding command/folder-naming can shift between CLI
> versions — if `netlify database migrations new` behaves differently than
> above, run `netlify database --help` to see the current subcommands, or
> just make sure the SQL in both files under
> `netlify/database/migrations/0001_init_schema/` and
> `.../0002_functions_and_workflow/` ends up applied, in that order (0001
> creates every table; 0002 adds Row-Level Security policies and functions
> that depend on those tables existing).

Deploy (or run `netlify database migrations` per the CLI's guidance) to
apply them. **Do not** connect directly with `psql`/`netlify database
connect` and run this SQL by hand outside the migration system — that
drifts your migration history from what's actually in the database, and
Netlify's docs are explicit that this isn't supported.

### Verify

```bash
netlify database connect
```

Then in the psql prompt: `\dt` should list `tenants`, `users`, `clients`,
`engagements`, `documents`, `invoices`, `assistant_conversations`, etc.
Run `select tablename, rowsecurity from pg_tables where schemaname='public';`
and confirm `rowsecurity` is `t` (true) for every tenant-scoped table — this
is the Row-Level Security guarantee described in README.md's "Security
model" section. Exit with `\q`.

## 5. Set the remaining environment variables

In the Netlify dashboard: **Site configuration → Environment variables**.
(`NETLIFY_DB_URL` is already there from step 3 — leave it alone.) Add:

- `SESSION_SECRET` — generate one with `openssl rand -base64 32`. Mark it secret.
- `GEMINI_API_KEY` — from [Google AI Studio](https://aistudio.google.com/apikey) (free tier — see README "AI provider & cost" for the data-usage trade-off). Mark it secret.
- `NEXT_PUBLIC_APP_URL` — the Netlify URL you'll be given after your first deploy (you can add/update this after step 6).

## 6. Run it locally first — don't skip this

```bash
npm install
netlify dev
```

`netlify dev` (not `npm run dev`) is what injects `NETLIFY_DB_URL` and your
other environment variables locally. Open the printed local URL, sign up a
firm, create a client, create an engagement, upload a document, try
"Extract with AI", and try the Tax Assistant. If all of that works locally,
your first real deploy is just plumbing.

Separately, before you trust a deploy:

```bash
npm run typecheck   # fix anything this reports
npm run build        # the real first compile of this codebase — see README
```

## 7. Deploy

```bash
netlify deploy --prod
```

Or just push to `main` on GitHub if you connected continuous deployment in
step 2 — Netlify will build and deploy automatically on every push.

## 8. Custom domain (optional)

Netlify dashboard → **Domain management → Add a domain**, follow the DNS
instructions. Once live, update `NEXT_PUBLIC_APP_URL` in environment
variables and redeploy.

## 9. Post-deploy checklist

- [ ] Sign up a new firm on the live URL; confirm the tenant, roles, and default document categories were created (`netlify database connect`, then query `select * from tenants;`)
- [ ] Create a client, create an engagement, confirm both appear correctly
- [ ] Upload a document; confirm `select blob_key from documents order by created_at desc limit 1;` returns a key, and that key is namespaced by tenant id
- [ ] Try "Extract with AI" on an uploaded image; confirm structured fields with confidence scores come back
- [ ] Open the Tax Assistant, ask a question scoped to an engagement; confirm it responds and the conversation persists on refresh
- [ ] From a client's detail page, invite a client contact by email; copy the temporary password shown; log in as that contact (separate browser/incognito) and confirm they land on `/portal` and can see **only** their own engagements and documents
- [ ] **Security check**: with two test tenants created, confirm in `netlify database connect` that `set_config('app.tenant_id', 'tenant-A-id', true)` followed by `select * from clients;` returns only tenant A's rows even when logged in as a Postgres superuser — this is your RLS guarantee actually working, not just configured
- [ ] Update branding accent colour to something low-contrast (e.g. `#FFFF00`) and confirm the server rejects it

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Build fails on Netlify with a TypeScript error | Run `npm run typecheck` locally, fix it, remove `typescript.ignoreBuildErrors` from `next.config.mjs` once clean. |
| "NETLIFY_DB_URL is not set" locally | You ran `npm run dev` instead of `netlify dev`. Only the latter injects Netlify-managed environment variables. |
| "The AI Tax Assistant is not configured" | `GEMINI_API_KEY` isn't set in Netlify's environment variables. |
| "SESSION_SECRET is not set (or is too short)" | Generate one with `openssl rand -base64 32` and set it in both `.env.local` (dev) and Netlify's environment variables (prod). |
| Signup succeeds but redirects back to `/signup` in a loop | The `provision_tenant()` function failed — check **Netlify → Functions → Logs** for the actual Postgres error (commonly: migrations weren't fully applied — re-check step 4). |
| A client-portal user can see other clients' data | Stop and treat this as a security incident. Re-run the RLS verification query in the post-deploy checklist above; confirm the 0002 migration actually applied (`select policyname from pg_policies where tablename='documents';` should list `tenant_isolation` and `client_portal_documents`). |
| File upload succeeds but "Extract with AI" can't read it | Confirm `@netlify/blobs` is deployed (it requires the Netlify runtime context — this won't work if you're running a plain `next start` outside Netlify's environment). |
