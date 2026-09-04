/**
 * Who is offered the reassignment request control.
 *
 * This matters more than a rule of its size normally would. The whole reassignment feature was
 * built — the request action, the admin queue, the approve/decline screen — and the salesperson's
 * control was never rendered on the lead page, so no request could ever be created and the queue
 * could only ever be empty. Wiring it up is only half the fix; these cases pin down the conditions,
 * because the flow cannot be exercised by hand until real salespeople own real leads.
 *
 * Each case mirrors a guard inside `requestReassignment`: the control must not be offered where
 * submitting it would be refused.
 */
import { describe, it, expect } from "vitest";
import { canRequestReassignment } from "./crm-constants.js";

const OWNER = "11111111-1111-1111-1111-111111111111";
const OTHER = "22222222-2222-2222-2222-222222222222";

describe("canRequestReassignment", () => {
  it("offers the control to a salesperson who owns an open lead", () => {
    expect(
      canRequestReassignment({ role: "salesperson", staffId: OWNER, assignedTo: OWNER, status: "Qualified" }),
    ).toBe(true);
  });

  it("refuses a salesperson looking at someone else's lead", () => {
    expect(
      canRequestReassignment({ role: "salesperson", staffId: OWNER, assignedTo: OTHER, status: "Qualified" }),
    ).toBe(false);
  });

  it("refuses an unassigned lead: there is no owner to hand it over", () => {
    expect(
      canRequestReassignment({ role: "salesperson", staffId: OWNER, assignedTo: null, status: "New" }),
    ).toBe(false);
  });

  it("refuses a viewer, who cannot mutate anything", () => {
    expect(
      canRequestReassignment({ role: "viewer", staffId: OWNER, assignedTo: OWNER, status: "Qualified" }),
    ).toBe(false);
  });

  it("refuses an admin, who reassigns directly from the queue", () => {
    expect(
      canRequestReassignment({ role: "admin", staffId: OWNER, assignedTo: OWNER, status: "Qualified" }),
    ).toBe(false);
  });

  it.each(["Won", "Lost"])("refuses a closed lead (%s), which needs no new owner", (status) => {
    expect(
      canRequestReassignment({ role: "salesperson", staffId: OWNER, assignedTo: OWNER, status }),
    ).toBe(false);
  });

  it("allows the other non-admin staff roles that own a lead", () => {
    for (const role of ["ceo", "executive"]) {
      expect(
        canRequestReassignment({ role, staffId: OWNER, assignedTo: OWNER, status: "Negotiation" }),
      ).toBe(true);
    }
  });

  it("refuses a signed-out visitor, where there is no staff at all", () => {
    expect(
      canRequestReassignment({ role: undefined, staffId: undefined, assignedTo: OWNER, status: "New" }),
    ).toBe(false);
  });

  it("refuses a lead in Nurture only when closed, not merely paused", () => {
    expect(
      canRequestReassignment({ role: "salesperson", staffId: OWNER, assignedTo: OWNER, status: "Nurture" }),
    ).toBe(true);
  });
});
