/**
 * Managed Technology Operations service page, transcribed verbatim from the approved
 * Website Copy (Part 2). This service is referenced from every service page footer (PRD 8).
 */
import type { MarketingPage } from "../types.js";

export const managedTechnologyOperations: MarketingPage = {
  meta: {
    slug: "/managed-technology-operations",
    routeClass: "service",
    title: "Software Maintenance & Support | Nexoris Technologies",
    description:
      "Monitoring, updates, support, and regular improvements on a monthly plan, with three service levels up to round-the-clock cover and a dedicated support team.",
  },
  hero: {
    h1: "We stay after launch, because that is when your software starts earning.",
    subline:
      "Most of our clients stay with us on a monthly plan after delivery. We monitor, update, support, and improve the platform in regular cycles, so the product you invested in keeps getting better instead of slowly going stale.",
    primaryCta: { label: "Compare service plans", href: "/contact" },
    secondaryCta: { label: "Find the right service", href: "#solution-finder" },
  },
  sections: [
    {
      kind: "cards",
      id: "pain",
      heading: "Software nobody maintains is quietly becoming a problem.",
      cards: [
        {
          body: "There was a security update. Nobody applied it. We found out the hard way.",
        },
        {
          body: "The system got slower and slower, and everyone just got used to it.",
        },
        {
          body: "The developer who built it moved on. Now nobody is quite sure how it works.",
        },
      ],
      closingLine:
        "Software does not stay still. It either gets maintained or it gets worse, and the second option always costs more in the end.",
    },
    {
      kind: "cards",
      id: "scope",
      heading: "What the plan covers.",
      cards: [
        {
          title: "Round-the-clock monitoring.",
          body: "We watch uptime, performance, and errors continuously, and usually know about problems before your users do.",
        },
        {
          title: "Security patches applied on time.",
          body: "The updates that protect you happen on schedule, not whenever someone remembers.",
        },
        {
          title: "Updates and speed improvements.",
          body: "The platform stays current and fast as it grows, instead of slowly thickening.",
        },
        {
          title: "Support when something breaks.",
          body: "A real route to a real person, with response times that match your plan.",
        },
        {
          title: "A quarterly review and improvement plan.",
          body: "Every three months we look at the data, agree the improvements worth making, and ship them.",
        },
        {
          title: "A sensible cloud bill.",
          body: "We watch your hosting costs and capacity, and trim what you are paying for but not using.",
        },
      ],
    },
    {
      kind: "cards",
      id: "plans",
      heading: "Three levels of cover.",
      cards: [
        {
          title: "Standard.",
          body: "Business-hours support with a 99.5% uptime target. Right for internal tools and platforms where an evening issue can wait for morning.",
        },
        {
          title: "Priority.",
          body: "Extended-hours support with a 99.9% uptime target. Right for customer-facing platforms where downtime costs sales and trust.",
        },
        {
          title: "Enterprise.",
          body: "24/7 monitoring, a dedicated account team, and an on-site engineer option for large accounts. Right for platforms the business genuinely cannot operate without.",
        },
      ],
      closingLine:
        "All plans include a clear monthly report with practical recommendations, written so a non-technical owner can read it in five minutes.",
    },
    {
      kind: "rich",
      id: "process",
      heading: "How the plan works month to month.",
      body: [
        "Monitoring runs all the time in the background. Issues get caught, triaged, and fixed according to your plan's response times. Once a month you get a report: what happened, what we fixed, what we recommend, in plain words. And once a quarter we ship a round of improvements, so the platform is measurably better every three months than it was the three months before.",
      ],
    },
    {
      kind: "rich",
      id: "proof",
      heading: "Why clients stay on these plans for years.",
      body: [
        "Uptime becomes something you stop thinking about. Hosting costs trend down because someone is actually watching them. And the platform keeps improving quarter after quarter, which is the difference between software as an asset and software as a slowly depreciating expense.",
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
      heading: "Who relies on managed operations.",
      intro:
        "Every platform we build can move onto a plan at launch, and most do. We also take on systems built by other teams, after an honest technical review.",
      note: "Cards rotate by traffic from Strapi",
    },
    {
      kind: "faq",
      id: "faq",
      heading: "Asked before every plan.",
      items: [
        {
          question: "Do you maintain software that other teams built?",
          answer:
            "Yes, after an honest technical review. We tell you what shape the system is really in, what it needs, and what the plan will cover, before either side commits.",
        },
        {
          question: "What counts as an emergency, and how fast do you respond?",
          answer:
            "Each plan defines it in writing: what severity levels mean, how fast we respond to each, and through which channels. You will know exactly what you are buying, with no vague promises.",
        },
        {
          question: "Can we change plans later?",
          answer:
            "Yes, monthly. Businesses grow, and a platform that was internal last year is customer-facing this year. The plan should follow the stakes.",
        },
        {
          question:
            "Is this just for emergencies, or does the product actually improve?",
          answer:
            "It improves, on a schedule. The quarterly improvement cycle is the heart of the plan: small, steady upgrades that compound, which is exactly how good software stays good.",
        },
        {
          question: "What does a plan cost?",
          answer:
            "It scales with the platform's size and the cover level, and it is a predictable monthly figure agreed in writing. Set it against the cost of one serious outage or one missed security patch, and the comparison usually ends the conversation.",
        },
      ],
    },
    {
      kind: "cta-band",
      id: "cta-band",
      heading:
        "The launch was the beginning. Protect what you built and let it keep improving.",
      button: { label: "Compare service plans", href: "/contact" },
    },
  ],
};
