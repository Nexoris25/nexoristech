/**
 * Extracting JSON from a model's reply.
 *
 * Every editorial feature in the CMS depends on this one function. It was a greedy regex, and the day a
 * reasoning model was reached through the fallback chain, every one of them broke with "bad seo json"
 * while the model was answering perfectly well. These are the reply shapes real providers produce.
 */
import { describe, it, expect } from "vitest";
import { parseJson } from "./content.service.js";

interface Seo { metaTitle: string; metaDescription: string }

describe("parseJson", () => {
  it("reads a bare object", () => {
    expect(parseJson<Seo>('{"metaTitle":"A","metaDescription":"B"}')).toEqual({ metaTitle: "A", metaDescription: "B" });
  });

  it("reads past a reasoning block, which is what broke it in production", () => {
    const reply = '<think>The user wants {metaTitle} and {metaDescription}. Let me draft one.</think>\n{"metaTitle":"A","metaDescription":"B"}';
    expect(parseJson<Seo>(reply)).toEqual({ metaTitle: "A", metaDescription: "B" });
  });

  it("reads out of a fenced code block", () => {
    expect(parseJson<Seo>('Here you go:\n```json\n{"metaTitle":"A","metaDescription":"B"}\n```\nHope that helps.'))
      .toEqual({ metaTitle: "A", metaDescription: "B" });
  });

  it("stops at the end of the object, not the last brace in the reply", () => {
    const reply = '{"metaTitle":"A","metaDescription":"B"}\n\nI also considered {another idea}.';
    expect(parseJson<Seo>(reply)).toEqual({ metaTitle: "A", metaDescription: "B" });
  });

  it("keeps braces that are inside a string value", () => {
    expect(parseJson<{ a: string }>('{"a":"a } brace and a { brace"}')).toEqual({ a: "a } brace and a { brace" });
  });

  it("keeps an escaped quote inside a value", () => {
    expect(parseJson<{ a: string }>('{"a":"she said \\"yes\\""}')).toEqual({ a: 'she said "yes"' });
  });

  it("reads a top-level array", () => {
    expect(parseJson<number[]>('prefix [1,2,3] suffix')).toEqual([1, 2, 3]);
  });

  it("keeps nested objects whole", () => {
    expect(parseJson<{ faqs: { q: string }[] }>('{"faqs":[{"q":"one"},{"q":"two"}]}'))
      .toEqual({ faqs: [{ q: "one" }, { q: "two" }] });
  });

  it("skips a malformed candidate and finds the valid one after it", () => {
    expect(parseJson<{ ok: boolean }>('{not json at all} then {"ok":true}')).toEqual({ ok: true });
  });

  it("returns null when there is no JSON at all", () => {
    expect(parseJson("I could not complete that request.")).toBeNull();
  });

  it("returns null on an unterminated object rather than guessing", () => {
    expect(parseJson('{"metaTitle":"A"')).toBeNull();
  });
});
