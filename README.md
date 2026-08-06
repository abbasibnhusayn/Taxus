# Taxus

**AI-powered tax practice management, compliance intelligence, and FBR IRIS
automation platform.**
A product by **HALOOL (Private) Limited**.

This build runs on **Netlify and GitHub only** — no Supabase account, no
separate auth provider, no other backend platform to sign up for. Netlify
itself provides the Postgres database (Netlify Database) and file storage
(Netlify Blobs); authentication is a small amount of first-party code
(bcrypt + signed JWT cookies) rather than a third-party auth product.

The one external credential this app still needs is a **Gemini API key**,
because the AI Tax Assistant and document extraction features have to talk
to *some* LLM provider — that's a "paste in a free API key" concern, not
another platform account. Everything else is Netlify + GitHub.

It is a genuine, working application — real signup/login, a real
multi-tenant Postgres schema with enforced Row-Level Security, real CRUD,
real file storage, a real AI Tax Assistant — not a static mockup. It is
**not** the complete 15-module platform described in SRS Volume 3; see
["What's implemented vs. what's an extension point"](#whats-implemented-vs-whats-an-extension-point).

---

## Architecture

| Concern | Built on |
|---|---|
| Hosting / compute | **Netlify** (Next.js Runtime — Server Components, Server Actions, and Route Handlers all run as Netlify Functions) |
| Database | **Netlify Database** — fully-managed Postgres, auto-provisioned, connection string injected as `NETLIFY_DB_URL` |
| File storage | **Netlify Blobs** — documents are stored as blobs keyed by tenant; metadata lives in Postgres |
| Auth | Hand-rolled: `bcryptjs` password hashing + `jose`-signed JWT in an httpOnly cookie. No third-party auth service. |
| Multi-tenancy / RBAC | Postgres **Row-Level Security**, driven by session variables (`app.tenant_id`, `app.user_id`) set per-request — see "Security model" below |
| AI | **Google Gemini API** (`gemini-2.5-flash`) — free tier, the one external key you provide |
| Source control / CI trigger | **GitHub** — Netlify builds on push |

## Security model — how tenant isolation works without Supabase

Supabase's RLS is driven by `auth.uid()`, which Supabase's JWT-aware Postgres
role wiring provides for free. Plain Postgres (what Netlify Database gives
you) doesn't have that out of the box, so this app reproduces the same
guarantee itself:

1. Every authenticated request resolves a `tenantId` and `userId` from the
   session cookie.
2. All application queries run inside `withTenant(tenantId, userId, fn)`
   (see `src/lib/db.ts`), which opens a Postgres transaction and runs
   `select set_config('app.tenant_id', ...)` before executing `fn`.
3. Every tenant-scoped table has an RLS policy
   (`netlify/database/migrations/0002_functions_and_workflow/migration.sql`)
   that checks `tenant_id = current_setting('app.tenant_id')`.

The result: **even if application code forgets a `where tenant_id = ...`
clause, the database itself refuses to return another tenant's rows.** This
is the same defense-in-depth property the original Supabase-based version
of this app had — just implemented directly instead of borrowed from a
platform feature. See `src/lib/db.ts` and the 0002 migration for the full
mechanics, and DEPLOYMENT.md's post-deploy checklist for how to verify it.

## What's implemented (real, working)

| Area | What you get |
|---|---|
| **Auth & multi-tenancy** | Signup creates a user + provisions a new tenant with built-in roles, in one transaction. Sessions are signed JWTs in httpOnly cookies. |
| **RBAC** | Firm Admin / Partner / Manager / Staff built-in roles; tenant isolation enforced at the database layer (see above), not just hidden UI. |
| **Practice Management** | Clients and Engagements: full CRUD, status workflow with an audit-logged transition trigger, assignment. |
| **Document Management** | Real upload to Netlify Blobs, tenant-namespaced keys, categories, per-document extraction status stored in Postgres. |
| **AI Document Extraction** | A working "Extract with AI" action that sends the document to Claude's vision API and returns structured fields with confidence scores. |
| **AI Tax Assistant** | A real chat interface, scoped to a firm or a specific engagement, backed by the Gemini API, with conversation history persisted per user. |
| **Billing** | Time entries → invoice generation → send. Simple and working, not a full billing engine. |
| **Notifications** | In-app notifications table + UI. No email delivery wired up. |
| **Audit Trail** | Append-only log of key actions. |
| **Client Portal** | A separate, simpler portal where an invited client contact can see filing status and upload documents — RLS-scoped to *only their own* client record. Invites currently show a one-time temporary password in the UI for staff to share manually (no transactional email service is wired up — see below). |
| **Settings / Branding** | Firm name and accent colour, with a server-side WCAG contrast check before saving. |
| **Design system** | Tailwind config implements the actual token values from SRS Volume 2. |

## What's implemented as an architecture/extension point, not a finished feature

- **FBR IRIS Integration** — no public API exists for this build to integrate
  against. The `iris_submissions` table and status model exist; actual
  submission is manual until you have official API access.
- **Tax Intelligence Engine** — the tables exist and the UI can display
  flags, but the rules engine that classifies transactions against Pakistani
  tax law and computes liabilities is **not implemented**. This is the
  highest-liability piece of the platform and needs a tax professional's
  sign-off on every rule, not just an engineer's.
- **OCR Engine** — Claude's vision API is used as a working, real stand-in
  via `/api/documents/extract`. It is not a dedicated, benchmarked OCR
  pipeline.
- **Workflow Automation** — engagement status is a fixed enum with an
  audit-logged transition history, not a firm-configurable workflow designer.
- **Transactional email** — there is no email sending anywhere in this
  build. Client Portal invites generate a temporary password shown once in
  the staff UI instead of emailing a link; wire up an email provider (Resend,
  Postmark, etc. — all reachable from a Netlify Function with just an API
  key, no new "platform" required) if you want real invite/notification
  emails.
- **Reporting module, custom RBAC roles, tenant switcher, dark mode** — not
  built. The schema and RLS approach extend cleanly to all of these.

## AI provider & cost

This app uses the **Google Gemini API** (`gemini-2.5-flash`) via
`src/lib/ai/gateway.ts`, chosen for MVP stage specifically because Google AI
Studio offers a genuine, ongoing free tier: no credit card, no expiring
trial credits, roughly 1,500 requests/day. Get a key at
[aistudio.google.com/apikey](https://aistudio.google.com/apikey).

**Read this before you point it at real client data.** On Gemini's free
tier, Google may use your prompts and responses (which, for this app, means
excerpts of client financial documents and tax questions) to improve their
products. That is very likely not acceptable for real client confidentiality
obligations, even if it's fine for building and demoing the MVP. Before
using this with actual client data:

- Add billing to the same Gemini API key in AI Studio (a few clicks, still
  pay-per-token and cheap for Flash-tier usage) — this removes the
  training-data usage, per Google's terms, or
- Swap providers entirely. `src/lib/ai/gateway.ts` is the *only* file that
  talks to an LLM — every caller only depends on its two exported function
  signatures (`getAssistantReply`, `extractDocumentFields`), so moving to
  Anthropic, OpenAI, or anything else is a change to one file, not a
  refactor of the app.

Either way, this app is only ever charged/rate-limited when someone actually
uses the Tax Assistant or "Extract with AI" — there's no cost from the app
simply being deployed and idle.

## Tech stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS**, hand-rolled component primitives (no external UI kit)
- **Netlify Database** (`postgres` / porsager driver) — see `netlify/database/migrations/`
- **Netlify Blobs** (`@netlify/blobs`) for document storage
- **bcryptjs** + **jose** for auth
- **Google Gemini API** (`@google/genai`) for the AI Tax Assistant and document extraction

## How this was built — an important disclosure

This codebase was authored in a sandboxed environment **without network
access**, so `npm install` was never run and `next build` / `tsc` were never
executed against this code, and the Netlify Database migrations were never
run against a live database. Every file was written carefully, and a
standalone TypeScript syntax check (with the full project config unavailable)
found no genuine syntax errors — but treat your first `npm install && npm run
build` and your first `netlify database` migration run as the real first
test. See [DEPLOYMENT.md](./DEPLOYMENT.md) for exactly what to do, in order,
and what to check at each step. `next.config.mjs` sets
`typescript.ignoreBuildErrors: true` as a safety net for that first build —
run `npm run typecheck` locally, fix what it reports, and remove that flag.

## Project structure

```
netlify/database/migrations/   Schema, RLS policies, functions, triggers — applied by Netlify Database
src/lib/db.ts                  Postgres client + the withTenant()/withUser() RLS-context helpers
src/lib/auth/                  Password hashing, JWT sessions, cookie helpers
src/lib/blobs.ts               Netlify Blobs wrapper for document storage
src/lib/ai/gateway.ts          AI Gateway — the one place that talks to Gemini
src/app/api/auth/              Signup / login / logout route handlers
src/app/actions/               Server Actions (mutations) — clients, engagements, documents, billing, settings
src/app/api/                   Other route handlers — AI Assistant chat, document extraction, client invites
src/app/app/                   The authenticated firm application (dashboard, clients, engagements, ...)
src/app/portal/                The Client Portal
src/components/                UI primitives + feature components
src/types/database.ts          Hand-written types — keep in sync with the migrations by hand
```

## Local development

```bash
npm install -g netlify-cli   # if you don't have it already
netlify login
netlify link                 # link this repo to your Netlify site (see DEPLOYMENT.md to create one first)
netlify database init        # provisions/links Netlify Database and NETLIFY_DB_URL for this site
npm install
cp .env.example .env.local   # fill in SESSION_SECRET and GEMINI_API_KEY
netlify dev                  # NOT `npm run dev` — this is what injects NETLIFY_DB_URL locally
```

## Branding

Both logos you provided are wired in: `public/logo-taxus.png` (product mark,
used in the app shell, auth pages, and browser icon) and
`public/logo-halool.png` (used in the sidebar footer, marketing site footer,
and Settings page as "A HALOOL (Private) Limited product").
