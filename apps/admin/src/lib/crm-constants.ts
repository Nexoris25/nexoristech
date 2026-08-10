/**
 * CRM lifecycle constants (PRD 2.2), shared by the server action and the client controls. Kept in
 * a plain module because a "use server" file may export only async actions.
 */
export const STAGES = [
  "New",
  "Contacted",
  "Qualified",
  "Scoping Call Booked",
  "Proposal Sent",
  "Negotiation",
  "Won",
  "Lost",
  "Nurture",
] as const;

export const LOST_REASONS = [
  "Budget",
  "Timing",
  "Chose another provider",
  "No response",
  "Not a fit",
  "Other",
] as const;

export interface StageState {
  error?: string;
  ok?: boolean;
}

/**
 * Staff roles.
 *
 * "ceo" and "executive" exist because the platform ships a CEO dashboard and there was previously no
 * way to say who it is for: the page checked only that someone was signed in, so a salesperson could
 * read company revenue. They read across the business rather than administering the platform, which
 * is what separates them from "admin".
 */
export const ROLES = ["admin", "ceo", "executive", "salesperson", "viewer"] as const;
export type Role = (typeof ROLES)[number];

/** Roles allowed to see company-wide financial performance: the CEO dashboard and its figures. */
export const EXECUTIVE_ROLES: readonly Role[] = ["admin", "ceo", "executive"];

/** True when this role may read the whole company's numbers rather than only its own work. */
export function isExecutive(role: string): boolean {
  return (EXECUTIVE_ROLES as readonly string[]).includes(role);
}

export interface StaffFormState {
  error?: string;
  ok?: boolean;
}

/** A lead is "open" (counts toward capacity) until it is Won or Lost. */
export const CLOSED_STAGES = ["Won", "Lost"] as const;

/** Stages at or beyond Qualified, used for the qualified-leads outcome and the pipeline board. */
export const QUALIFIED_PLUS = [
  "Qualified",
  "Scoping Call Booked",
  "Proposal Sent",
  "Negotiation",
  "Won",
] as const;

/**
 * The engagement type captured with a Won deal. Matches the Finance invoice engagement types so
 * the Deal-to-Engagement handover (PRD 5.9) never retypes it.
 */
export const ENGAGEMENT_TYPES = [
  { value: "one-off", label: "One-off project" },
  { value: "retainer", label: "Retainer" },
  { value: "project", label: "Project" },
] as const;

export type EngagementTypeValue = (typeof ENGAGEMENT_TYPES)[number]["value"];

/**
 * The target metrics (PRD 5.7), split into monthly outcome targets and weekly activity targets.
 * "naira" metrics hold a Sales Won Value amount; the rest are plain counts. Every figure tied to a
 * Won deal reads as Sales Won Value, never Revenue.
 */
export const TARGET_METRICS = [
  { key: "deals_won", period: "monthly", label: "Deals won", kind: "count" },
  { key: "won_value", period: "monthly", label: "Sales Won Value", kind: "naira" },
  { key: "qualified", period: "monthly", label: "Qualified leads", kind: "count" },
  { key: "first_responses", period: "weekly", label: "First responses on time", kind: "count" },
  { key: "proposals", period: "weekly", label: "Proposals sent", kind: "count" },
] as const;

export type TargetMetricKey = (typeof TARGET_METRICS)[number]["key"];

export interface ProfileState {
  error?: string;
  ok?: boolean;
}

export interface ReassignState {
  error?: string;
  ok?: boolean;
}

export interface DraftState {
  error?: string;
  draft?: string;
  draftedBy?: "ai" | "template";
}

export interface FollowUpState {
  error?: string;
  ok?: boolean;
  draft?: string;
  draftedBy?: "ai" | "template";
}
