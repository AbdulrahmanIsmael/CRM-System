export type ContactType = "person" | "company";
export type ContactStatus = "active" | "inactive" | "archived";
export type DealPriority = "low" | "medium" | "high" | "urgent";
export type DealStageRecord = {
  id: string;
  user_id: string;
  name: string;
  position: number;
  color: string | null;
  is_won: boolean;
  is_lost: boolean;
};
export type ProjectStatus = "not_started" | "in_progress" | "on_hold" | "completed" | "cancelled";
export type InvoicePricingType = "itemized" | "fixed";
export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled";
export type TaskPriority = DealPriority;
export type TaskStatus = "todo" | "in_progress" | "done";
export type EventType = "meeting" | "call" | "follow_up" | "deadline" | "other";

export interface ContactRecord {
  id: string;
  user_id: string;
  type: ContactType;
  status: ContactStatus;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  company_id: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  industry: string | null;
  location: string | null;
  timezone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DealRecord {
  id: string;
  user_id: string;
  contact_id: string;
  stage_id: string;
  title: string;
  value: number | string;
  currency: string;
  priority: DealPriority;
  expected_close_date: string | null;
  notes: string | null;
  won_at: string | null;
  lost_at: string | null;
  lost_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectRecord {
  id: string;
  user_id: string;
  contact_id: string;
  deal_id: string | null;
  name: string;
  description: string | null;
  status: ProjectStatus;
  start_date: string | null;
  deadline: string | null;
  budget: number | string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceRecord {
  id: string;
  user_id: string;
  contact_id: string;
  project_id: string | null;
  invoice_number: string;
  pricing_type: InvoicePricingType;
  fixed_amount: number | string | null;
  subtotal: number | string;
  tax_rate: number | string;
  tax_amount: number | string;
  discount: number | string;
  total: number | string;
  currency: string;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskRecord {
  id: string;
  user_id: string;
  contact_id: string | null;
  deal_id: string | null;
  project_id: string | null;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventRecord {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  type: EventType;
  start_time: string;
  end_time: string;
  all_day: boolean;
  contact_id: string | null;
  deal_id: string | null;
  project_id: string | null;
  color: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActivityRecord {
  id: string;
  user_id: string;
  action: "created" | "updated" | "deleted" | "status_changed" | "stage_changed" | string;
  entity_type: "contact" | "deal" | "project" | "invoice" | "task" | string;
  entity_id: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface GlobalSearchResult {
  id: string;
  title: string;
  subtitle?: string | null;
  href: string;
}
