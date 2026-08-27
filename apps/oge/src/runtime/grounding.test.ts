/**
 * The figure guard.
 *
 * The rule under test is narrow and worth stating exactly: a figure is unsupported when it does not
 * appear in the context GIVEN, which is not the same as claiming the real site never publishes it.
 * The uptime case below uses an extract that stops before the plan levels, and against that extract
 * the percentages are unsupported. Against the full maintenance page, which does publish 99.5% and
 * 99.9% uptime targets, the same answer passes, and should.
 */
import { describe, expect, it } from "vitest";
import { figuresIn, SentenceStream, unsupportedFigures } from "./grounding.js";

/** An extract of the maintenance page, cut before the section that lists the plan levels. */
const MAINTENANCE =
  "Round-the-clock monitoring. We watch uptime, performance, and errors continuously, and usually " +
  "know about problems before your users do. Support when something breaks. A real route to a real " +
  "person, with response times that match your plan.";

describe("unsupportedFigures", () => {
  it("catches uptime targets that the retrieved context does not contain", () => {
    const answer =
      "Each plan we offer includes a clear uptime target, such as 99.5%, 99.9%, or 24/7 monitoring.";
    expect(unsupportedFigures(answer, MAINTENANCE)).toEqual(["99.5%", "99.9%"]);
  });

  it("passes an answer that repeats the context without adding a number", () => {
    const answer =
      "We watch uptime and performance continuously, and response times match the plan you choose.";
    expect(unsupportedFigures(answer, MAINTENANCE)).toEqual([]);
  });

  it("catches an invented price", () => {
    expect(
      unsupportedFigures("A basic site starts at ₦850,000.", "We publish no fixed prices."),
    ).toEqual(["₦850,000"]);
  });

  it("allows a price the context actually states, however it is punctuated", () => {
    expect(unsupportedFigures("It costs ₦850,000.", "The fee is 850000 naira.")).toEqual([]);
    expect(unsupportedFigures("It costs 850000 naira.", "The fee is ₦850,000.")).toEqual([]);
  });

  it("does not fire on the small numbers of ordinary prose", () => {
    const answer = "We will ask 3 questions, and the first 2 are about scope. Support is 24/7.";
    expect(unsupportedFigures(answer, "We ask a few questions about scope.")).toEqual([]);
  });

  it("does not let a bare number licence a percentage", () => {
    // 99 appearing as a count is not a source for "99% uptime", which is the exact shape of the
    // fabrication: a real number in the context, reused as a service level.
    expect(unsupportedFigures("We guarantee 99% uptime.", "We support 99 clients.")).toEqual([
      "99%",
    ]);
  });

  it("reports each invented figure once, however often it is repeated", () => {
    expect(unsupportedFigures("50% now and 50% later.", "no figures here")).toEqual(["50%"]);
  });

  it("treats a year or a large quantity as a figure to check", () => {
    expect(unsupportedFigures("We have served 12,000 businesses.", "We serve businesses.")).toEqual(
      ["12,000"],
    );
    expect(unsupportedFigures("We have served 12,000 businesses.", "12000 businesses served")).toEqual(
      [],
    );
  });
});

describe("figuresIn", () => {
  it("reads a figure as written and as digits", () => {
    expect(figuresIn("about 99.9% of the time")).toEqual([
      { written: "99.9%", digits: "999" },
    ]);
  });
});

describe("SentenceStream", () => {
  it("holds a sentence back until it is complete", () => {
    const stream = new SentenceStream();
    expect(stream.push("We build ")).toEqual([]);
    expect(stream.push("software. And we ")).toEqual(["We build software."]);
    expect(stream.push("support it.")).toEqual([]);
    expect(stream.flush()).toBe(" And we support it.");
  });

  it("breaks on a blank line, so a list is not held to the end of the answer", () => {
    const stream = new SentenceStream();
    expect(stream.push("Here is what we offer:\n\n- Websites\n\n")).toEqual([
      "Here is what we offer:\n\n",
      "- Websites\n\n",
    ]);
  });

  it("loses nothing: every character pushed comes back out, in order", () => {
    const stream = new SentenceStream();
    const chunks = ["The fee ", "is ₦5. ", "Really! ", "Is it?\n\nYes"];
    const out = chunks.flatMap((c) => stream.push(c)).join("") + stream.flush();
    expect(out).toBe(chunks.join(""));
  });
});
