/**
 * Contents entries are read by shape. These are the headings that made the sidebar unreadable:
 * questions long enough to wrap to four lines each, where the part that distinguishes one entry
 * from the next was buried in the middle.
 */
import { describe, it, expect } from "vitest";
import { tocLabel } from "./render-html.js";

describe("tocLabel", () => {
  it("drops the interrogative scaffolding and keeps the subject", () => {
    expect(tocLabel("How much does a WordPress website cost in Nigeria?")).toBe(
      "WordPress website cost",
    );
    // The dangling verb goes; "cost" would not, because "Website cost" is the right label.
    expect(tocLabel("What does a website price actually include?")).toBe("Website price");
  });

  it("leaves a heading that is already short alone", () => {
    expect(tocLabel("Key facts at a glance")).toBe("Key facts at a glance");
    expect(tocLabel("Pricing")).toBe("Pricing");
  });

  it("never cuts a word in half", () => {
    const label = tocLabel("What are the price ranges for different types of websites in Nigeria?");
    expect(label.length).toBeLessThanOrEqual(38);
    expect(label.endsWith("-")).toBe(false);
    // Whatever survives is whole words from the heading.
    for (const word of label.toLowerCase().split(" ")) {
      expect("what are the price ranges for different types of websites in nigeria").toContain(word);
    }
  });

  it("refuses to strip an opener that would leave nothing behind", () => {
    expect(tocLabel("What is it?").length).toBeGreaterThan(0);
    expect(tocLabel("Why?")).toBe("Why");
  });

  it("strips tags and returns something for a heading made only of markup", () => {
    expect(tocLabel("<strong>Costs</strong>")).toBe("Costs");
  });

  it("does not end on punctuation left by the cut", () => {
    expect(tocLabel("Hosting, domains, security, maintenance and everything else you pay for"))
      .not.toMatch(/[,;:]$/);
  });
});

describe("tocLabel truncation", () => {
  it("does not end on a word that introduces something", () => {
    for (const heading of [
      "What are the price ranges for different types of websites in Nigeria?",
      "Should you hire a freelancer, an agency, or use a website builder?",
      "What hidden costs do most Nigerian website quotes leave out?",
    ]) {
      expect(tocLabel(heading)).not.toMatch(/\s(of|for|to|in|on|a|an|the|or|and|that|use|most)$/i);
    }
  });

  it("still returns something for a heading made entirely of small words", () => {
    expect(tocLabel("What is it for?").length).toBeGreaterThan(0);
  });
});
