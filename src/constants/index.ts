// App-wide constants and configuration values

/** Application name */
export const APP_NAME = "Nexus CRM";

/** Deal pipeline default stages */
export const DEAL_STAGES = [
  "Lead",
  "Contacted",
  "Proposal Sent",
  "Negotiation",
  "Won",
  "Lost",
] as const;

/** Invoice statuses */
export const INVOICE_STATUSES = [
  "Draft",
  "Sent",
  "Paid",
  "Overdue",
  "Cancelled",
] as const;

/** Task priorities */
export const TASK_PRIORITIES = ["Low", "Medium", "High", "Urgent"] as const;

/** Contact types */
export const CONTACT_TYPES = ["Client", "Lead", "Partner", "Other"] as const;
