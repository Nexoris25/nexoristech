/**
 * Data Infrastructure & AI Readiness service page, transcribed from the approved design handoff
 * (data-infrastructure-ai-readiness.html). The hero uses the interactive data-health scan widget.
 * Copy, icons, and FAQ match the handoff; the "what solid ground looks like" checklist is
 * transcribed as the AI feature cards, and proof states honest outcomes without fabricated figures.
 * Consumed by the ServiceView template.
 */
import type { ServiceContent } from "../../components/service/ServiceView.js";
import { ReadinessScan } from "../../components/service/ReadinessScan.js";

export const dataInfrastructureAiReadiness: ServiceContent = {
  breadcrumb: "Data Infrastructure & AI Readiness",
  heroWidget: <ReadinessScan />,
  hero: {
    kicker: "Understand your numbers · The groundwork",
    h1: "Before you spend serious money on AI, make sure your data can carry it.",
    lede: "This is the groundwork every other technology investment depends on, and the step most organisations try to skip. We assess, clean, and organise your data so the reports and AI built on it give answers you can actually trust.",
    primaryCta: { label: "Book a data audit", href: "/contact" },
    secondaryCta: { label: "Find the right service", href: "/#finder" },
    stats: [],
  },
  problem: {
    kicker: "When the numbers disagree",
    h2: "Two departments, two reports, two different numbers.",
    quotes: [
      {
        text: "The same customer exists three times in our system, spelled three different ways.",
        tag: "Duplicate records",
      },
      { text: "We ran an AI pilot last year. It is not something we talk about.", tag: "The quiet failure" },
      {
        text: "Honestly, nobody is sure who owns which data, or who is allowed to see what.",
        tag: "No ownership",
      },
    ],
    close: (
      <>
        None of this means your team is careless. Data drifts in every growing business.{" "}
        <b>The difference is whether you fix it before or after it costs you a big decision.</b>
      </>
    ),
  },
  scope: {
    kicker: "What we build",
    h2: "The groundwork we do.",
    items: [
      {
        icon: (
          <>
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </>
        ),
        title: "A full audit of your data and its quality",
        body: "Where it lives, how good it is, where it disagrees with itself, and what that is costing you.",
      },
      {
        icon: (
          <>
            <path d="M4 7c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3z" />
            <path d="M4 7v10c0 1.7 3.6 3 8 3s8-1.3 8-3V7" />
            <path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" />
          </>
        ),
        title: "Cleaning, deduplication, and enrichment at scale",
        body: "Duplicates merged, gaps filled, formats standardised, across the whole estate rather than one spreadsheet at a time.",
      },
      {
        icon: (
          <>
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
            <path d="M10 6.5h4M6.5 10v4M17.5 10v4M10 17.5h4" />
          </>
        ),
        title: "Data architecture and design",
        body: "A clear structure for how your data should be organised, so the mess does not simply grow back.",
      },
      {
        icon: (
          <>
            <path d="M20 17.6A5 5 0 0 0 18 8h-1.3A8 8 0 1 0 4 16.3" />
            <path d="M8 17l4 4 4-4M12 12v9" />
          </>
        ),
        title: "A proper central store in the cloud",
        body: "One place where your data lives, governed and backed up, instead of forty exports on personal laptops.",
      },
      {
        icon: <path d="M12 2l2.4 5 5.6.6-4.2 3.8 1.2 5.6L12 19l-5 3 1.2-5.6L4 12.6 9.6 12z" />,
        title: "An honest AI readiness assessment",
        body: "What you could build on your data today, what needs fixing first, and a roadmap in priority order.",
      },
      {
        icon: (
          <>
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4M12 15v3" />
          </>
        ),
        title: "Clear ownership and access rules",
        body: "Who owns what, who can see what, and how long things are kept, written down and enforced.",
      },
    ],
  },
  ai: {
    kicker: "The payoff",
    h2: "What solid ground looks like.",
    intro:
      "When the foundation is right, everything built on top of it gets easier, and most of the arguments simply stop.",
    feats: [
      {
        icon: <path d="M4 12l5 5L20 6" />,
        title: "One shared, trusted view",
        body: "One shared, trusted view of your data across the whole business.",
      },
      {
        icon: <path d="M4 12l5 5L20 6" />,
        title: "Reports that match on the first pass",
        body: "Reports that match on the first pass, so meetings are about decisions instead of definitions.",
      },
      {
        icon: <path d="M4 12l5 5L20 6" />,
        title: "A clean base for what comes next",
        body: "A clean base for any dashboard, forecast, or AI feature that comes next.",
      },
      {
        icon: <path d="M4 12l5 5L20 6" />,
        title: "NDPR-aligned handling",
        body: "Data handled and retained in line with the NDPR, so compliance stops being guesswork.",
      },
      {
        icon: <path d="M4 12l5 5L20 6" />,
        title: "A roadmap you can act on",
        body: "A roadmap in priority order you can act on, with us or without us.",
      },
    ],
    foot: "The unglamorous step first, so the exciting parts actually work.",
  },
  process: {
    h2: "How a readiness project runs.",
    steps: [
      {
        title: "The audit",
        body: "A clear picture of what you have, what is broken, and what each problem costs, explained in plain language rather than database vocabulary.",
      },
      {
        title: "The fixes",
        body: "The cleaning, merging, and structuring happen in priority order, so the most expensive problems get solved first.",
      },
      {
        title: "The governance",
        body: "The rules and ownership that stop the mess growing back, because clean data is a habit, not a one-off event.",
      },
    ],
    note: (
      <>
        Cleaning data once is a project. Keeping it clean is a habit.{" "}
        <b>We do both, in that order.</b>
      </>
    ),
  },
  proof: {
    kicker: "The unglamorous truth",
    h2: "Why this step decides everything after it.",
    lede: "Nothing here is a magic number. It is the plain reason this step decides whether everything after it works.",
    cards: [
      {
        tag: "The unglamorous truth",
        title: "Most AI projects that fail, fail here first, on duplicated, gappy, contradictory data.",
      },
      {
        tag: "The unglamorous truth",
        title: "A model built on bad data gives confident answers that are quietly wrong.",
      },
      {
        tag: "The unglamorous truth",
        title: "The organisations that get value from AI are almost always the ones that did this step first.",
      },
    ],
  },
  industryLinks: {
    kicker: "Industries",
    h2: "Where clean data is non-negotiable.",
    lede: "Clean, governed data is non-negotiable wherever a wrong record carries real consequences.",
    links: [
      {
        href: "/fintech-software",
        icon: <path d="M3 9l9-5 9 5M5 9v8M19 9v8M9 17v-5M15 17v-5M3 21h18" />,
        title: "Financial Services & Fintech",
        body: "Secure banking, payments, and onboarding built to scale.",
      },
      {
        href: "/healthcare-software",
        icon: <path d="M3 12h4l2-6 4 12 2-6h6" />,
        title: "Healthcare & Clinics",
        body: "Records, scheduling, and patient care handled with care.",
      },
      {
        href: "/insurance-software",
        icon: (
          <>
            <path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z" />
            <path d="M9 12l2 2 4-4" />
          </>
        ),
        title: "Insurance",
        body: "Policy administration, claims, and broker tools that move in days.",
      },
      {
        href: "/government-digital-solutions",
        icon: <path d="M3 9l9-5 9 5M5 9v9M19 9v9M9 18v-6M15 18v-6M3 21h18" />,
        title: "Government & Public Sector",
        body: "Citizen services and registries that issue in days, not months.",
      },
      {
        href: "/logistics-software",
        icon: (
          <>
            <path d="M3 6h11v9H3zM14 9h4l3 3v3h-7z" />
            <circle cx="7" cy="18" r="1.6" />
            <circle cx="17.5" cy="18" r="1.6" />
          </>
        ),
        title: "Logistics & Supply Chain",
        body: "Fleets, deliveries, and stock tracked from depot to door.",
      },
      {
        href: "/manufacturing-software",
        icon: (
          <>
            <path d="M3 21V9l6 4V9l6 4V6l6 4v11z" />
            <path d="M3 21h18" />
          </>
        ),
        title: "Manufacturing",
        body: "Production lines, quality, and output you can see live.",
      },
    ],
  },
  faq: {
    kicker: "Questions",
    h2: "Asked before every data project.",
    lede: "The honest answers about the audit, the disruption, and how this relates to the NDPR.",
    items: [
      {
        q: "How long does the audit take?",
        a: "Typically two to four weeks depending on how many systems you run. You get a written report: what you have, what is broken, what each issue costs, and a fix list in priority order. It is yours whether or not you continue with us.",
      },
      {
        q: "Will this disrupt our daily operations?",
        a: "No. The audit reads, it does not change. The cleaning that follows happens in supervised stages with checks before anything replaces anything.",
      },
      {
        q: "Is our data too far gone?",
        a: "We have not met that business yet. The further gone it is, the bigger the payback from fixing it, and the audit tells you exactly how big.",
      },
      {
        q: "Do we need this before a dashboard or AI project?",
        a: "Sometimes light cleaning along the way is enough, and we will say so. But if your reports already disagree with each other, building on top of that just makes the disagreement faster. The audit settles the question with evidence.",
      },
      {
        q: "How does this relate to the NDPR?",
        a: "Directly. Knowing what personal data you hold, where, and for how long is both good engineering and a legal requirement. The governance work covers retention, access, and consent records, so compliance stops being guesswork.",
      },
    ],
  },
  cta: {
    h2: "Build the foundation once, properly, and everything after it gets easier.",
    body: "Tell us which systems hold your data today. We will reply within one business day with a way to measure exactly what shape it is in.",
    button: { label: "Book a data audit", href: "/contact" },
  },
};
