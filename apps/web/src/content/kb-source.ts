/**
 * Turns the hardcoded marketing pages into knowledge-base sources (PRD 10.3, 6.3). Each page
 * is flattened into readable text with blocks separated by blank lines, so the @nexoris/kb
 * chunker keeps paragraphs and FAQ pairs intact. This is the web-build half of the knowledge
 * base; apps/oge embeds and indexes the result and merges it with published CMS content. No
 * secrets are involved here.
 */
import { absoluteUrl } from "@nexoris/seo";
import type { KbSource } from "@nexoris/kb";
import { allHardcodedPages } from "./index.js";
import type { MarketingPage, Section } from "./types.js";

function sectionBlocks(section: Section): string[] {
  const blocks: string[] = [];
  switch (section.kind) {
    case "rich":
      if (section.heading) blocks.push(section.heading);
      if (section.intro) blocks.push(section.intro);
      if (section.body) blocks.push(...section.body);
      break;
    case "cards":
      if (section.heading) blocks.push(section.heading);
      if (section.intro) blocks.push(section.intro);
      for (const card of section.cards) {
        blocks.push(card.title ? `${card.title} ${card.body}` : card.body);
      }
      if (section.closingLine) blocks.push(section.closingLine);
      break;
    case "steps":
      if (section.heading) blocks.push(section.heading);
      if (section.intro) blocks.push(section.intro);
      for (const step of section.steps) {
        blocks.push(`${step.title} ${step.body}`);
      }
      break;
    case "faq":
      blocks.push(section.heading);
      for (const item of section.items) {
        // Keep each question and answer together as one atomic block.
        blocks.push(`${item.question} ${item.answer}`);
      }
      break;
    case "cta-band":
      blocks.push(section.heading);
      if (section.body) blocks.push(section.body);
      break;
    case "form":
      blocks.push(section.heading);
      for (const field of section.fields) {
        blocks.push(
          field.microcopy ? `${field.label}. ${field.microcopy}` : field.label,
        );
      }
      blocks.push(
        `${section.briefBuilder.heading} ${section.briefBuilder.body}`,
      );
      break;
    case "dynamic":
      // The note describes a CMS-sourced block and is not page copy, so it is not indexed.
      if (section.heading) blocks.push(section.heading);
      if (section.intro) blocks.push(section.intro);
      break;
  }
  return blocks;
}

/** Flatten one marketing page into a knowledge-base source document. */
export function pageToKbSource(page: MarketingPage): KbSource {
  const blocks: string[] = [page.hero.h1];
  if (page.hero.subline) blocks.push(page.hero.subline);
  if (page.hero.trustStrip) blocks.push(page.hero.trustStrip);
  for (const section of page.sections) {
    blocks.push(...sectionBlocks(section));
  }
  return {
    url: absoluteUrl(page.meta.slug),
    title: page.meta.title,
    text: blocks.join("\n\n"),
  };
}

/** Every hardcoded page as a knowledge-base source. */
export function hardcodedKbSources(): KbSource[] {
  return allHardcodedPages.map(pageToKbSource);
}
