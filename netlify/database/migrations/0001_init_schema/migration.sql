-- Taxus — Initial Schema (Netlify Database / plain Postgres edition)
-- A HALOOL (Private) Limited product.
--
-- This replaces the earlier Supabase-based schema. Auth is handled entirely
-- in application code (see src/lib/auth.ts) — there is no auth.users table
-- here; `users` below IS the user table. Tenant isolation is enforced by
-- Postgres Row-Level Security using a per-transaction session variable
-- (app.tenant_id) set by src/lib/db.ts on every authenticated request,
-- exactly as SRS Volume 5 Ch.11 specifies, just without Supabase's
-- auth.uid()-flavoured helpers.

create extension if not exists "pgcrypto";

-- =========================================================================
-- IDENTITY & ACCESS
-- =========================================================================

create table tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  subdomain text not null unique,
  status text not null default 'active' check (status in ('active','suspended','terminated')),
  plan_tier text not null default 'starter' check (plan_tier in ('starter','professional','enterprise')),
  logo_url text,
  accent_color text default '#2F5496',
  base_currency text not null default 'PKR',
  created_at timestamptz not null default now()
);

create table users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  full_name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table clients (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  legal_name text not null,
  ntn text,
  cnic text,
  taxpayer_type text not null default 'individual' check (taxpayer_type in ('individual','aop','company')),
  email text,
  phone text,
  address text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  unique (tenant_id, ntn)
);

create table tenant_memberships (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  is_client boolean not null default false, -- true for Client Portal users
  client_id uuid references clients(id) on delete cascade, -- required when is_client = true
  joined_at timestamptz not null default now(),
  unique (tenant_id, user_id),
  constraint client_membership_has_client check (is_client = false or client_id is not null)
);

create table roles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete cascade,
  name text not null,
  is_builtin boolean not null default false,
  permissions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (tenant_id, name)
);

create table user_roles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role_id uuid not null references roles(id) on delete cascade,
  assigned_by uuid references users(id),
  assigned_at timestamptz not null default now(),
  unique (tenant_id, user_id, role_id)
);

-- =========================================================================
-- PRACTICE MANAGEMENT
-- =========================================================================

create table engagement_templates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  name text not null,
  engagement_type text not null,
  milestones jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table engagements (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  template_id uuid references engagement_templates(id),
  title text not null,
  type text not null default 'income_tax_return',
  status text not null default 'draft' check (status in ('draft','in_progress','in_review','filed','acknowledged','archived')),
  tax_year text,
  due_date date,
  assignee_id uuid references users(id),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table engagement_milestones (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  engagement_id uuid not null references engagements(id) on delete cascade,
  name text not null,
  status text not null default 'not_started' check (status in ('not_started','in_progress','done')),
  due_date date,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- =========================================================================
-- DOCUMENT MANAGEMENT (files live in Netlify Blobs; this is the metadata index)
-- =========================================================================

create table document_categories (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  name text not null,
  retention_years int not null default 6,
  unique (tenant_id, name)
);

create table documents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  engagement_id uuid references engagements(id) on delete cascade,
  client_id uuid references clients(id) on delete cascade,
  category_id uuid references document_categories(id),
  file_name text not null,
  blob_key text not null, -- key under which the file bytes are stored in Netlify Blobs
  mime_type text,
  size_bytes bigint,
  uploaded_by uuid references users(id),
  extraction_status text not null default 'none' check (extraction_status in ('none','pending','done','failed')),
  extracted_fields jsonb,
  extraction_confidence numeric(3,2),
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

-- =========================================================================
-- TAX INTELLIGENCE (lightweight MVP model — see README for scope)
-- =========================================================================

create table transactions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  engagement_id uuid not null references engagements(id) on delete cascade,
  source text not null default 'manual',
  description text,
  amount numeric(18,2) not null,
  classification text,
  confidence numeric(3,2),
  created_at timestamptz not null default now()
);

create table compliance_flags (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  engagement_id uuid not null references engagements(id) on delete cascade,
  flag_type text not null,
  severity text not null default 'medium' check (severity in ('low','medium','high')),
  status text not null default 'open' check (status in ('open','resolved','dismissed')),
  description text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table workflow_transitions_log (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  engagement_id uuid not null references engagements(id) on delete cascade,
  from_status text,
  to_status text not null,
  actor_id uuid references users(id),
  note text,
  created_at timestamptz not null default now()
);

-- =========================================================================
-- BILLING
-- =========================================================================

create table time_entries (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  engagement_id uuid not null references engagements(id) on delete cascade,
  user_id uuid not null references users(id),
  minutes int not null check (minutes > 0),
  billable boolean not null default true,
  description text,
  entry_date date not null default current_date,
  invoiced boolean not null default false,
  created_at timestamptz not null default now()
);

create table invoices (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  engagement_id uuid references engagements(id),
  invoice_number text not null,
  status text not null default 'draft' check (status in ('draft','sent','partially_paid','paid','void')),
  currency text not null default 'PKR',
  total_amount numeric(18,2) not null default 0,
  issued_at date,
  due_at date,
  created_by uuid references users(id),
  created_at timestamptz not null default now(),
  unique (tenant_id, invoice_number)
);

create table invoice_line_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  invoice_id uuid not null references invoices(id) on delete cascade,
  description text not null,
  amount numeric(18,2) not null,
  source_type text not null default 'manual' check (source_type in ('time_entry','milestone','manual'))
);

-- =========================================================================
-- AI TAX ASSISTANT
-- =========================================================================

create table assistant_conversations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  user_id uuid not null references users(id),
  scope_type text not null default 'firm' check (scope_type in ('firm','client','engagement')),
  scope_id uuid,
  title text,
  created_at timestamptz not null default now()
);

create table assistant_messages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  conversation_id uuid not null references assistant_conversations(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

-- =========================================================================
-- NOTIFICATIONS, AUDIT TRAIL, IRIS TRACKING
-- =========================================================================

create table notifications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  category text not null default 'system',
  title text not null,
  body text,
  link_path text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  actor_id uuid references users(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before_value jsonb,
  after_value jsonb,
  created_at timestamptz not null default now()
);

create table iris_submissions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  engagement_id uuid not null references engagements(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','submitted','acknowledged','failed')),
  ack_reference text,
  submitted_by uuid references users(id),
  submitted_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

-- =========================================================================
-- INDEXES
-- =========================================================================

create index idx_clients_tenant on clients(tenant_id);
create index idx_engagements_tenant_status on engagements(tenant_id, status);
create index idx_engagements_client on engagements(client_id);
create index idx_documents_tenant on documents(tenant_id);
create index idx_documents_engagement on documents(engagement_id);
create index idx_transactions_engagement on transactions(engagement_id);
create index idx_invoices_tenant on invoices(tenant_id);
create index idx_notifications_user_unread on notifications(user_id, read_at);
create index idx_audit_log_tenant_created on audit_log(tenant_id, created_at desc);
create index idx_assistant_messages_conversation on assistant_messages(conversation_id, created_at);
create index idx_tenant_memberships_user on tenant_memberships(user_id);
create index idx_users_email on users(email);
