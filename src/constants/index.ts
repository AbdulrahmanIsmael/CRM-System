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

export const CONTACT_LEAD_SOURCES = [
  "khamsat",
  "mostaql",
  "upwork",
  "fiverr",
  "freelancer",
  "people_per_hour",
  "guru",
  "toptal",
  "workana",
  "99designs",
  "designcrowd",
  "dribbble",
  "malt",
  "worksome",
  "contra",
  "linkedin",
  "behance",
  "facebook",
  "instagram",
  "referral",
  "direct",
  "other",
] as const;
