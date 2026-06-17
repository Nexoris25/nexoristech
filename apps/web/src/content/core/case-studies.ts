/**
 * Case Studies hub content, transcribed verbatim from the approved Website Copy
 * (Part 1, Case Studies hub).
 *
 * The Covyvo and GLEEN outbound links are intentionally omitted: the PRD (1.7) says not to
 * add them yet, since those sites are not live. The card copy is transcribed in full; the
 * "Visit the ... website" links are added once the sites go live.
 */
import type { MarketingPage } from "../types.js";

export const caseStudies: MarketingPage = {
  meta: {
    slug: "/case-studies",
    routeClass: "collection",
    title: "Case Studies & Projects | Nexoris Technologies",
    description:
      "Real projects we have delivered and what changed for the businesses behind them. Filter by industry or service to find a situation that looks a lot like yours.",
  },
  hero: {
    h1: "The work, with the numbers attached.",
    subline:
      "Every project here shipped against agreed outcomes. Filter by industry or service to find a business that looked like yours before we started.",
  },
  sections: [
    {
      kind: "dynamic",
      id: "featured",
      note: "Featured case study from Strapi: image, headline result, client quote",
    },
    {
      kind: "dynamic",
      id: "grid",
      intro: "All, By industry, By service, By outcome",
      note: "Filterable case study grid from Strapi",
    },
    {
      kind: "cards",
      id: "in-house",
      heading: "We also build our own products.",
      intro:
        "When we build for ourselves, we feel every shortcut. So we do not take them, for us or for you. These two products run on the same process, tools, and standards as every client project.",
      cards: [
        {
          title: "Covyvo.",
          body: "Payroll, e-invoicing, and core business tools in one platform, built for small and medium businesses in Nigeria. The Nigeria Tax Act 2025 changed the compliance rules, and most SME tools have not caught up, so we built one that has. Covyvo handles payroll around current Nigerian tax and statutory requirements, e-invoicing designed for the new rules, and the everyday tools a small business runs on, all as a subscription with no large upfront cost. It is under active development, and early access is open.",
        },
        {
          title: "GLEEN.",
          body: "An exam preparation platform for Nigerian students sitting WAEC, NECO, JAMB, and Post-UTME. Cramming the week before has never worked, and students know it too, so GLEEN is built around consistency: content matched to the actual syllabuses, progress tracking students can see, and rewards that make regular study a habit rather than a struggle. It is under active development, and early access is open.",
        },
      ],
    },
    {
      kind: "cta-band",
      id: "cta-band",
      heading:
        "Your project could be the one at the top of this page next year.",
      body: "Tell us what you are trying to achieve, and we will map the route to it.",
      button: { label: "Start a project", href: "/contact" },
    },
  ],
};
