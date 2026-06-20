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
