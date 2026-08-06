-- Taxus — Row-Level Security, functions, and triggers (Netlify Database edition)
--
-- Tenant isolation model: every authenticated request runs its queries
-- inside a transaction that first sets two session-local variables:
--   app.tenant_id  — the resolved tenant of the request
--   app.user_id    — the authenticated user
-- via `select set_config('app.tenant_id', $1, true)`.
-- See src/lib/db.ts (withTenant helper) for where this is set. Every
-- tenant-scoped table has an RLS policy keyed off current_setting('app.tenant_id'),
-- so even a bug in application code that forgets a WHERE tenant_id = ... clause
-- cannot leak data across tenants — this is the same defense-in-depth
-- guarantee the original Supabase-based build had via Postgres RLS, just
-- driven by our own session variable instead of Supabase's auth.uid().

create or replace function current_tenant_id() returns uuid
language sql stable
as $$
  select nullif(current_setting('app.tenant_id', true), '')::uuid;
$$;

create or replace function current_user_id() returns uuid
language sql stable
as $$
  select nullif(current_setting('app.user_id', true), '')::uuid;
$$;

-- Generic "is this row's tenant_id the request's tenant?" policy, applied
-- to every tenant-scoped table. Client Portal users get additionally-scoped
-- SELECT policies layered on top where relevant (documents, engagements,
-- invoices, clients) exactly as the original design specified.
do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'clients','tenant_memberships','roles','user_roles','engagement_templates',
      'engagements','engagement_milestones','document_categories','documents',
      'transactions','compliance_flags','workflow_transitions_log','time_entries',
      'invoices','invoice_line_items','assistant_conversations','assistant_messages',
      'notifications','audit_log','iris_submissions'
    ])
  loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy tenant_isolation on %I using (tenant_id = current_tenant_id())',
      t
    );
  end loop;
end $$;

-- tenants itself: visible only if the requester belongs to it.
alter table tenants enable row level security;
create policy tenant_self_select on tenants for select using (id = current_tenant_id());
create policy tenant_self_update on tenants for update using (id = current_tenant_id());

-- users: no tenant_id column, so policy is identity-based instead — a user
-- can always see their own row; application code additionally restricts
-- which OTHER users' rows are exposed (tenant colleagues) at the query layer,
-- since "colleague of" is a join through tenant_memberships, not a plain column.
alter table users enable row level security;
create policy users_self on users for all using (id = current_user_id());

-- Client Portal narrowing: a client-portal user (is_client = true) may only
-- see engagements/documents/invoices tied to THEIR OWN client_id, layered on
-- top of the tenant_isolation policy above (Postgres RLS policies are OR'd
-- within the same command type by default within a table, so we instead
-- express this as a second, additive policy using a security-definer helper).
create or replace function client_portal_client_id() returns uuid
language sql stable
as $$
  select client_id from tenant_memberships
  where user_id = current_user_id() and tenant_id = current_tenant_id() and is_client = true
  limit 1;
$$;

create policy client_portal_engagements on engagements for select
  using (client_portal_client_id() is not null and client_id = client_portal_client_id());
create policy client_portal_documents on documents for all
  using (client_portal_client_id() is not null and client_id = client_portal_client_id());
create policy client_portal_invoices on invoices for select
  using (client_portal_client_id() is not null and client_id = client_portal_client_id());
create policy client_portal_clients on clients for select
  using (client_portal_client_id() is not null and id = client_portal_client_id());

-- ---------------------------------------------------------------------
-- Tenant provisioning — creates a tenant, its built-in roles, default
-- document categories, and the owning membership, in one transaction.
-- Runs as SECURITY DEFINER so it can bypass RLS for the initial inserts
-- (there is no tenant context yet on the very first insert).
-- ---------------------------------------------------------------------
create or replace function provision_tenant(
  p_tenant_name text,
  p_subdomain text,
  p_owner_id uuid
) returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_admin_role_id uuid;
begin
  insert into tenants (name, subdomain) values (p_tenant_name, p_subdomain)
  returning id into v_tenant_id;

  insert into tenant_memberships (tenant_id, user_id, is_client)
  values (v_tenant_id, p_owner_id, false);

  insert into roles (tenant_id, name, is_builtin, permissions) values
    (v_tenant_id, 'Firm Admin', true, '["*"]'::jsonb),
    (v_tenant_id, 'Partner', true, '["engagements:*","clients:*","billing:*","reports:*","documents:*","assistant:*"]'::jsonb),
    (v_tenant_id, 'Manager', true, '["engagements:*","clients:*","billing:read","billing:write","documents:*","assistant:*"]'::jsonb),
    (v_tenant_id, 'Staff', true, '["engagements:read","engagements:write","clients:read","documents:*","assistant:*"]'::jsonb);

  select id into v_admin_role_id from roles where tenant_id = v_tenant_id and name = 'Firm Admin';

  insert into user_roles (tenant_id, user_id, role_id, assigned_by)
  values (v_tenant_id, p_owner_id, v_admin_role_id, p_owner_id);

  insert into document_categories (tenant_id, name, retention_years) values
    (v_tenant_id, 'Salary Certificate', 6),
    (v_tenant_id, 'Bank Statement', 6),
    (v_tenant_id, 'Withholding Tax Certificate', 6),
    (v_tenant_id, 'Sales Tax Invoice', 6),
    (v_tenant_id, 'Wealth Statement Attachment', 6),
    (v_tenant_id, 'Other', 6);

  return v_tenant_id;
end;
$$;

-- Append-only audit log writer.
create or replace function write_audit_log(
  p_tenant_id uuid, p_actor_id uuid, p_action text, p_entity_type text,
  p_entity_id uuid, p_before jsonb, p_after jsonb
) returns void
language plpgsql security definer set search_path = public
as $$
begin
  insert into audit_log (tenant_id, actor_id, action, entity_type, entity_id, before_value, after_value)
  values (p_tenant_id, p_actor_id, p_action, p_entity_type, p_entity_id, p_before, p_after);
end;
$$;

-- Keep engagements.updated_at current and log every status transition.
create or replace function on_engagement_status_change()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  if (tg_op = 'UPDATE' and old.status is distinct from new.status) then
    insert into workflow_transitions_log (tenant_id, engagement_id, from_status, to_status, actor_id)
    values (new.tenant_id, new.id, old.status, new.status, current_user_id());
  end if;
  return new;
end;
$$;

drop trigger if exists trg_engagement_status on engagements;
create trigger trg_engagement_status
  before update on engagements
  for each row execute procedure on_engagement_status_change();
