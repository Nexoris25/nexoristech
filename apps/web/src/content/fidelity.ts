/**
 * Content fidelity helper for the Nexoris Technologies marketing site.
 *
 * Collects every verbatim string a content module renders (metas, H1s, sublines, CTAs,
 * headings, intros, card and step copy, FAQs, and closing lines) so the content-fidelity test
 * can confirm each one appears in the approved Website Copy. Dynamic [square bracket]
 * blocks are sourced from the CMS, not copy, so their notes are excluded. Whitespace is
 * normalised on both sides because the source was extracted from a PDF that hard-wraps
 * lines; the comparison is about the text, not the wrapping.
 */
import type { Cta, MarketingPage, Section } from "./types.js";

/** Collapse all whitespace runs to single spaces and trim, for a wrap-insensitive comparison. */
export function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function ctaLabels(...ctas: (Cta | undefined)[]): string[] {
  return ctas.filter((c): c is Cta => c !== undefined).map((c) => c.label);
}

function sectionStrings(section: Section): string[] {
  const out: string[] = [];
  switch (section.kind) {
    case "rich":
      if (section.heading) out.push(section.heading);
      if (section.intro) out.push(section.intro);
      if (section.body) out.push(...section.body);
      out.push(...ctaLabels(section.link));
      break;
    case "cards":
      if (section.heading) out.push(section.heading);
      if (section.intro) out.push(section.intro);
      for (const card of section.cards) {
        if (card.title) out.push(card.title);
        out.push(card.body);
        out.push(...(card.links ?? []).map((l) => l.label));
      }
      if (section.closingLine) out.push(section.closingLine);
      out.push(...ctaLabels(section.footerLink));
      break;
    case "steps":
      if (section.heading) out.push(section.heading);
      if (section.intro) out.push(section.intro);
      for (const step of section.steps) {
        out.push(step.title);
        out.push(step.body);
      }
      out.push(...ctaLabels(section.link));
      break;
    case "faq":
      out.push(section.heading);
      for (const item of section.items) {
        out.push(item.question);
        out.push(item.answer);
      }
      break;
    case "cta-band":
      out.push(section.heading);
      if (section.body) out.push(section.body);
      out.push(...ctaLabels(section.button));
      break;
    case "form":
      out.push(section.heading);
      for (const field of section.fields) {
        out.push(field.label);
        if (field.microcopy) out.push(field.microcopy);
        out.push(...(field.options ?? []));
      }
      out.push(section.briefBuilder.heading);
      out.push(section.briefBuilder.body);
      out.push(...section.briefBuilder.buttons);
      out.push(section.submitLabel);
      out.push(section.afterSubmit);
      break;
    case "dynamic":
      // The note summarises a CMS-sourced block and is not approved copy, so it is excluded.
      if (section.heading) out.push(section.heading);
      if (section.intro) out.push(section.intro);
      out.push(...ctaLabels(section.link));
      break;
  }
  return out;
}

/** Every verbatim string a page renders, for the content-fidelity check. */
export function collectVerbatimStrings(page: MarketingPage): string[] {
  const out: string[] = [page.meta.title, page.meta.description, page.hero.h1];
  if (page.hero.subline) out.push(page.hero.subline);
  if (page.hero.trustStrip) out.push(page.hero.trustStrip);
  out.push(...ctaLabels(page.hero.primaryCta, page.hero.secondaryCta));
  for (const section of page.sections) {
    out.push(...sectionStrings(section));
  }
  return out;
}
