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

export const ROLES = ["admin", "salesperson", "viewer"] as const;
export type Role = (typeof ROLES)[number];

export interface StaffFormState {
  error?: string;
  ok?: boolean;
}

/** A lead is "open" (counts toward capacity) until it is Won or Lost. */
export const CLOSED_STAGES = ["Won", "Lost"] as const;

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
