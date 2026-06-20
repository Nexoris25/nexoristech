import { describe, it, expect } from "vitest";
import { businessDayDeadline, isSlaBreached } from "./business-days.js";

describe("businessDayDeadline", () => {
  it("adds one business day on a weekday", () => {
    // Monday 2026-06-15 -> Tuesday 2026-06-16
    const due = businessDayDeadline(new Date("2026-06-15T09:00:00Z"));
    expect(due.toISOString().slice(0, 10)).toBe("2026-06-16");
  });

  it("skips the weekend from a Friday", () => {
    // Friday 2026-06-19 -> Monday 2026-06-22
    const due = businessDayDeadline(new Date("2026-06-19T09:00:00Z"));
    expect(due.toISOString().slice(0, 10)).toBe("2026-06-22");
  });

  it("skips the weekend from a Saturday", () => {
    // Saturday 2026-06-20 -> Monday 2026-06-22
    const due = businessDayDeadline(new Date("2026-06-20T09:00:00Z"));
    expect(due.toISOString().slice(0, 10)).toBe("2026-06-22");
  });
});

describe("isSlaBreached", () => {
  it("is false before the deadline and true after", () => {
    const created = new Date("2026-06-15T09:00:00Z");
    expect(isSlaBreached(created, new Date("2026-06-15T18:00:00Z"))).toBe(false);
    expect(isSlaBreached(created, new Date("2026-06-17T09:00:00Z"))).toBe(true);
  });
});
