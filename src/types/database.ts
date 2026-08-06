// Hand-written types mirroring netlify/database/migrations/0001_init_schema/migration.sql.
// There is no code-generation step for these (unlike Supabase's `gen types`) —
// keep this file in sync by hand whenever you change the schema.

export type TaxpayerType = "individual" | "aop" | "company";
export type EngagementStatus =
  | "draft"
  | "in_progress"
  | "in_review"
  | "filed"
  | "acknowledged"
  | "archived";
export type DocumentExtractionStatus = "none" | "pending" | "done" | "failed";
export type InvoiceStatus = "draft" | "sent" | "partially_paid" | "paid" | "void";
export type FlagSeverity = "low" | "medium" | "high";
export type FlagStatus = "open" | "resolved" | "dismissed";

export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  status: "active" | "suspended" | "terminated";
  plan_tier: "starter" | "professional" | "enterprise";
  logo_url: string | null;
  accent_color: string | null;
  base_currency: string;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  mfa_enabled: boolean;
  created_at: string;
}

export interface Client {
  id: string;
  tenant_id: string;
  legal_name: string;
  ntn: string | null;
  cnic: string | null;
  taxpayer_type: TaxpayerType;
  email: string | null;
  phone: string | null;
  address: string | null;
  archived_at: string | null;
  created_at: string;
}

export interface Engagement {
  id: string;
  tenant_id: string;
  client_id: string;
  template_id: string | null;
  title: string;
  type: string;
  status: EngagementStatus;
  tax_year: string | null;
  due_date: string | null;
  assignee_id: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentRow {
  id: string;
  tenant_id: string;
  engagement_id: string | null;
  client_id: string | null;
  category_id: string | null;
  file_name: string;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  uploaded_by: string | null;
  extraction_status: DocumentExtractionStatus;
  extracted_fields: Record<string, unknown> | null;
  extraction_confidence: number | null;
  archived_at: string | null;
  created_at: string;
}

export interface Invoice {
  id: string;
  tenant_id: string;
  client_id: string;
  engagement_id: string | null;
  invoice_number: string;
  status: InvoiceStatus;
  currency: string;
  total_amount: number;
  issued_at: string | null;
  due_at: string | null;
  created_by: string | null;
  created_at: string;
}

export interface NotificationRow {
  id: string;
  tenant_id: string;
  user_id: string;
  category: string;
  title: string;
  body: string | null;
  link_path: string | null;
  read_at: string | null;
  created_at: string;
}

export interface ComplianceFlag {
  id: string;
  tenant_id: string;
  engagement_id: string;
  flag_type: string;
  severity: FlagSeverity;
  status: FlagStatus;
  description: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface AssistantConversation {
  id: string;
  tenant_id: string;
  user_id: string;
  scope_type: "firm" | "client" | "engagement";
  scope_id: string | null;
  title: string | null;
  created_at: string;
}

export interface AssistantMessage {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}
