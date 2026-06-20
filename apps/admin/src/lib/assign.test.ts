import { describe, it, expect } from "vitest";
import { chooseAssignee, type AssigneeCandidate } from "./assign.js";

const base: AssigneeCandidate[] = [
  { id: "a", industries: ["fintech-software"], openCount: 3, capacityCap: 10 },
  { id: "b", industries: ["healthcare-software"], openCount: 1, capacityCap: 10 },
  { id: "c", industries: [], openCount: 0, capacityCap: 10 },
];

describe("chooseAssignee", () => {
  it("prefers a salesperson whose industries match the lead", () => {
    expect(chooseAssignee(base, "fintech-software")).toBe("a");
  });

  it("falls back to the lightest load when no one matches the industry", () => {
    expect(chooseAssignee(base, "logistics-software")).toBe("c");
  });

  it("balances by open-lead count with no industry", () => {
    expect(chooseAssignee(base, undefined)).toBe("c");
  });

  it("skips anyone at or over capacity", () => {
    const full: AssigneeCandidate[] = [
      { id: "a", industries: ["fintech-software"], openCount: 10, capacityCap: 10 },
      { id: "b", industries: [], openCount: 5, capacityCap: 10 },
    ];
    expect(chooseAssignee(full, "fintech-software")).toBe("b");
  });

  it("returns null when everyone is at capacity", () => {
    const full: AssigneeCandidate[] = [
      { id: "a", industries: [], openCount: 10, capacityCap: 10 },
    ];
    expect(chooseAssignee(full, undefined)).toBeNull();
  });

  it("treats a null capacity cap as unlimited and is deterministic on ties", () => {
    const tie: AssigneeCandidate[] = [
      { id: "z", industries: [], openCount: 2, capacityCap: null },
      { id: "y", industries: [], openCount: 2, capacityCap: null },
    ];
    expect(chooseAssignee(tie, undefined)).toBe("y");
  });
});
