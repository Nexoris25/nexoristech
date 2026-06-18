/**
 * Data Infrastructure & AI Readiness service page, transcribed verbatim from the approved
 * Website Copy (Part 2).
 */
import type { MarketingPage } from "../types.js";

export const dataInfrastructureAiReadiness: MarketingPage = {
  meta: {
    slug: "/data-infrastructure-ai-readiness",
    routeClass: "service",
    title: "Data Cleaning & AI Readiness | Nexoris Technologies",
    description:
      "We audit, clean, and organise your business data so every report agrees and any AI or analytics you build on top of it gives answers you can genuinely trust.",
  },
  hero: {
    h1: "Before you spend serious money on AI, make sure your data can carry it.",
    subline:
      "This is the groundwork every other technology investment depends on, and the step most organisations try to skip. We assess, clean, and organise your data so the reports and AI built on it give answers you can actually trust.",
    primaryCta: { label: "Book a data audit", href: "/contact" },
    secondaryCta: { label: "Find the right service", href: "#solution-finder" },
  },
  sections: [
    {
      kind: "cards",
      id: "pain",
      heading:
        "Two departments, two reports, two different numbers. Sound familiar?",
      cards: [
        {
          body: "The same customer exists three times in our system, spelled three different ways.",
        },
        {
          body: "We ran an AI pilot last year. It is not something we talk about.",
        },
        {
          body: "Honestly, nobody is sure who owns which data, or who is allowed to see what.",
        },
      ],
      closingLine:
        "None of this means your team is careless. Data drifts in every growing business. The difference is whether you fix it before or after it costs you a big decision.",
    },
    {
      kind: "cards",
      id: "scope",
      heading: "The groundwork we do.",
      cards: [
        {
          title: "A full audit of your data and its quality.",
          body: "Where it lives, how good it is, where it disagrees with itself, and what that is costing you.",
        },
        {
          title: "Cleaning, deduplication, and enrichment at scale.",
          body: "Duplicates merged, gaps filled, formats standardised, across the whole estate rather than one spreadsheet at a time.",
        },
        {
          title: "Data architecture and design.",
          body: "A clear structure for how your data should be organised, so the mess does not simply grow back.",
        },
        {
          title: "A proper central store in the cloud.",
          body: "One place where your data lives, governed and backed up, instead of forty exports on personal laptops.",
        },
        {
          title: "An honest AI readiness assessment.",
          body: "What you could build on your data today, what needs fixing first, and a roadmap in priority order.",
        },
        {
          title: "Clear ownership and access rules.",
          body: "Who owns what, who can see what, and how long things are kept, written down and enforced.",
        },
      ],
    },
    {
      kind: "rich",
      id: "outcomes",
      heading: "What solid ground looks like.",
      body: [
        "One shared, trusted view of your data across the business. Reports that match on the first pass, so meetings are about decisions instead of definitions. A clean base for any dashboard, forecast, or AI feature that comes next. Data handled and retained in line with the NDPR. And a roadmap in priority order that you can act on, with us or without us.",
      ],
    },
    {
      kind: "rich",
      id: "process",
      heading: "How a readiness project runs.",
      body: [
        "The audit comes first and stands on its own: a clear picture of what you have, what is broken, and what each problem costs, explained in plain language rather than database vocabulary. Then the fixes happen in priority order, biggest payback first. And the governance comes last, the rules and ownership that keep it fixed, because cleaning data once is a project and keeping it clean is a habit.",
      ],
    },
    {
      kind: "rich",
      id: "proof",
      heading: "Why this step decides everything after it.",
      body: [
        "Most AI projects that fail, fail here first: a model built on duplicated, gappy, contradictory data gives confident answers that are quietly wrong. The organisations that get value from AI are almost always the ones that did this unglamorous step first. It is not the exciting part. It is the part that decides whether the exciting part works.",
      ],
    },
    {
      kind: "dynamic",
      id: "proof-cards",
      note: "Case study cards from Strapi, filtered by service tag",
    },
    {
      kind: "dynamic",
      id: "industries-links",
      heading: "Where clean data is non-negotiable.",
      note: "Cards: Fintech, Insurance, Government, Manufacturing, Healthcare",
    },
    {
      kind: "faq",
      id: "faq",
      heading: "Asked before every data project.",
      items: [
        {
          question: "How long does the audit take?",
          answer:
            "Typically two to four weeks depending on how many systems you run. You get a written report: what you have, what is broken, what each issue costs, and a fix list in priority order. It is yours whether or not you continue with us.",
        },
        {
          question: "Will this disrupt our daily operations?",
          answer:
            "No. The audit reads, it does not change. The cleaning that follows happens in supervised stages with checks before anything replaces anything.",
        },
        {
          question: "Is our data too far gone?",
          answer:
            "We have not met that business yet. The further gone it is, the bigger the payback from fixing it, and the audit tells you exactly how big.",
        },
        {
          question: "Do we need this before a dashboard or AI project?",
          answer:
            "Sometimes light cleaning along the way is enough, and we will say so. But if your reports already disagree with each other, building on top of that just makes the disagreement faster. The audit settles the question with evidence.",
        },
        {
          question: "How does this relate to the NDPR?",
          answer:
            "Directly. Knowing what personal data you hold, where, and for how long is both good engineering and a legal requirement. The governance work covers retention, access, and consent records, so compliance stops being guesswork.",
        },
      ],
    },
    {
      kind: "cta-band",
      id: "cta-band",
      heading:
        "Build the foundation once, properly, and everything after it gets easier.",
      button: { label: "Book a data audit", href: "/contact" },
    },
  ],
};
