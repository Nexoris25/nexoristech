/**
 * A field an editor types must never be able to stop a deployment.
 *
 * buildMetadata throws on copy that breaks a hard limit, which is right for titles written in this
 * repository and wrong for one typed into the CMS. A 77-character author meta title took the whole
 * site build down, so the author page was never generated and 404'd in production while working in
 * development. These are the shapes that did it.
 */
import { describe, it, expect } from "vitest";
import { META_LIMITS } from "@nexoris/seo";
import { authorMetadata } from "./author-seo.js";
import type { AuthorProfile } from "../lib/cms.js";

const author = (over: Partial<AuthorProfile> = {}): AuthorProfile =>
  ({ name: "Chinedu Nwogu", role: "Founder", expertise: [], faq: [], ...over }) as AuthorProfile;

const titleOf = (m: ReturnType<typeof authorMetadata>): string => String(m.title ?? "");

describe("authorMetadata", () => {
  it("does not throw on a meta title far over the limit", () => {
    const long = "Chinedu Nwogu: Founder & CEO, Nexoris Technologies Limited, Lagos Nigeria";
    expect(() => authorMetadata("chinedu-nwogu", author({ metaTitle: long }))).not.toThrow();
  });

  it("fits the title within the limit, brand suffix included", () => {
    const long = "Chinedu Nwogu: Founder & CEO, Nexoris Technologies Limited, Lagos Nigeria";
    expect(titleOf(authorMetadata("chinedu-nwogu", author({ metaTitle: long }))).length)
      .toBeLessThanOrEqual(META_LIMITS.titleMax);
  });

  it("does not brand a title twice", () => {
    const already = "Chinedu Nwogu | Nexoris Technologies";
    const title = titleOf(authorMetadata("chinedu-nwogu", author({ metaTitle: already })));
    expect(title.match(/Nexoris Technologies/g)).toHaveLength(1);
  });

  it("survives a bio too long to be a description", () => {
    expect(() =>
      authorMetadata("chinedu-nwogu", author({ bio: "A sentence about the work. ".repeat(40) })),
    ).not.toThrow();
  });

  it("still produces a canonical for an author that does not exist", () => {
    const m = authorMetadata("nobody", null);
    expect(() => m).not.toThrow();
    expect(String(m.alternates?.canonical ?? "")).toContain("/nobody");
  });
});
