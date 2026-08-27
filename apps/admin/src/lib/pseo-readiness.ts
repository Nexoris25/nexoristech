/**
 * Data readiness for a programmatic page, derived from the page itself.
 *
 * The gate has always required a readiness score of 100 before a programmatic page may publish, but
 * nothing ever produced one. The API read `readiness_score` from a form field that does not exist on
 * the generated-page form, so the value was always null, the gate always saw 0, and every publish was
 * held back with "Data readiness is 0%". No programmatic page could ever go live. It was invisible
 * only because none had been created yet.
 *
 * A score an editor types is worthless anyway: it is a number about the page asserted by the person
 * who wants it published. So it is measured instead, from what the row actually contains. Every
 * condition below is something the editor can see and act on, and something the platform can check
 * without judgement.
 *
 * This is deliberately not the full ReadinessRecord in packages/pseo. That model wants data the CMS
 * does not capture per page (feature-matrix rows, cited data sources, pricing tables). These are the
 * conditions the stored row can actually answer, honestly.
 */
import { MIN_BODY_WORDS } from "./pseo-gate.js";
import { describeMetaDescription } from "./meta-quality.js";

export interface ReadinessInput {
  body: string | null | undefined;
  authorId: string | null | undefined;
  metaDescription: string | null | undefined;
  /** The place this page is for, when it is a location page. */
  targetLocation?: string | null | undefined;
}

export interface ReadinessCondition {
  /** What the editor sees on the readiness panel. */
  label: string;
  passed: boolean;
  /** What to do about it, when it has not passed. */
  hint?: string;
}

export interface Readiness {
  /** 0 to 100, the share of conditions met. */
  score: number;
  conditions: ReadinessCondition[];
  unmet: string[];
}

const text = (html: string | null | undefined): string =>
  (html ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

const words = (html: string | null | undefined): number =>
  text(html).split(" ").filter(Boolean).length;

/** "Nigeria" is the national baseline rather than a place, so it asks for no local specifics. */
const NATIONAL = "nigeria";

export function computeReadiness(input: ReadinessInput): Readiness {
  const body = input.body ?? "";
  const plain = text(body).toLowerCase();
  const wordCount = words(body);
  const meta = describeMetaDescription(input.metaDescription ?? "");

  const location = (input.targetLocation ?? "").trim();
  const isLocationPage = location.length > 0 && location.toLowerCase() !== NATIONAL;
  // A location page has to say something about the place beyond naming it in the title. Two
  // mentions in the body is a low bar, and it is the difference between a real local page and the
  // same page with a city swapped in.
  const localMentions = isLocationPage
    ? (plain.match(new RegExp(location.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) ?? []).length
    : 0;

  const conditions: ReadinessCondition[] = [
    {
      label: "Named author",
      passed: Boolean(input.authorId),
      hint: "Assign an author with a real profile. Search engines and readers both need to know who wrote this.",
    },
    {
      label: "Substantive body",
      passed: wordCount >= MIN_BODY_WORDS,
      hint: `The body is ${wordCount} words; at least ${MIN_BODY_WORDS} are needed.`,
    },
    {
      label: "Meta description",
      passed: meta.endsComplete && meta.inRange,
      hint: meta.hint ?? "Write a meta description between 155 and 160 characters that finishes its sentence.",
    },
    {
      label: "Sectioned content",
      passed: (body.match(/<h2\b/gi) ?? []).length >= 3,
      hint: "Break the page into at least three sections with H2 headings, so a reader can find the part they came for.",
    },
    {
      label: "Internal links",
      passed: /<a\s[^>]*href=/i.test(body),
      hint: "Link to at least one related page. A page with no way onward is a dead end.",
    },
    {
      label: isLocationPage ? `Local detail for ${location}` : "Local detail",
      passed: !isLocationPage || localMentions >= 2,
      hint: isLocationPage
        ? `Say something specific to ${location}. A page that only swaps the place name is the duplicate this gate exists to stop.`
        : "Not a location page, so no local specifics are required.",
    },
  ];

  const passed = conditions.filter((c) => c.passed).length;
  return {
    score: Math.round((passed / conditions.length) * 100),
    conditions,
    unmet: conditions.filter((c) => !c.passed).map((c) => c.hint ?? c.label),
  };
}
