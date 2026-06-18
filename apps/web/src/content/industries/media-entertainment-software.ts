/**
 * Media, Entertainment & Publishing industry page, transcribed verbatim from the approved
 * Website Copy (Part 3).
 */
import type { MarketingPage } from "../types.js";

export const mediaEntertainmentSoftware: MarketingPage = {
  meta: {
    slug: "/media-entertainment-software",
    routeClass: "industry",
    title: "Media & Streaming Platforms | Nexoris Technologies",
    description:
      "Content systems, streaming platforms, and subscription tools for publishers and broadcasters. Grow your audience and finally earn real money from your archive.",
  },
  hero: {
    h1: "Get your content in front of more people and earn more from every view.",
    subline:
      "We build content systems, streaming platforms, and subscription tools for publishers, broadcasters, and studios. Your archive starts earning, your audience numbers start making sense, and your content reaches people in more languages than your team speaks.",
    primaryCta: { label: "Talk to us about your platform", href: "/contact" },
    secondaryCta: { label: "Find the right service", href: "#solution-finder" },
  },
  sections: [
    {
      kind: "cards",
      id: "pain",
      heading:
        "Great content, scattered distribution, slow money. The pattern is familiar.",
      cards: [
        {
          body: "Our audience lives on platforms we do not control, under rules we do not set.",
        },
        {
          body: "We know our content is watched. We do not really know by whom, or what they do next.",
        },
        { body: "The archive is full of valuable work earning nothing." },
        {
          body: "Tagging and filing content is a full-time job that never finishes.",
        },
      ],
      closingLine:
        "The content was always the hard part, and you already have it. What is missing is the machinery that distributes it, measures it, and gets paid for it. Machinery is buildable.",
    },
    {
      kind: "cards",
      id: "solutions",
      heading: "What we build for media.",
      cards: [
        {
          title: "Content management systems.",
          body: "Your newsroom or studio publishing at speed, on a system shaped to your editorial flow.",
        },
        {
          title: "Streaming platforms for web and mobile.",
          body: "Your content, on your platform, under your rules, with your audience data.",
        },
        {
          title: "Subscriptions and paywalls.",
          body: "The machinery of recurring revenue: plans, payments, renewals, and the metering between free and paid.",
        },
        {
          title: "Advertising integration.",
          body: "Inventory managed and served properly, direct and programmatic.",
        },
        {
          title: "Distribution dashboards.",
          body: "Where every piece of content went and how it performed, across every channel, in one view.",
        },
        {
          title: "Creator portals.",
          body: "Contributors uploading, tracking, and getting paid without emails.",
        },
        {
          title: "Audience analytics.",
          body: "Who is watching, reading, and listening, and what they are likely to want next.",
        },
      ],
    },
    {
      kind: "cards",
      id: "ai-where-it-helps",
      heading: "Where AI can grow the audience.",
      cards: [
        {
          title: "Content tagged and catalogued automatically.",
          body: "Every item enriched with proper metadata on arrival, which is what makes the archive findable and sellable.",
        },
        {
          title: "Recommendations that keep people watching.",
          body: "Each viewer's next item chosen well, which is where watch time lives.",
        },
        {
          title: "Captions and translations generated automatically.",
          body: "Every piece accessible and exportable to new language markets at near-zero cost.",
        },
        {
          title: "Thumbnails and summaries drafted for approval.",
          body: "The packaging work accelerated, with editors deciding.",
        },
        {
          title: "Audience predictions.",
          body: "The segments forming in your data, visible before the competition sees them.",
        },
        {
          title: "Piracy monitoring.",
          body: "Your content found where it should not be, early enough to act.",
        },
      ],
      closingLine:
        "Editorial judgement stays human. The AI handles the repetitive parts.",
    },
    {
      kind: "rich",
      id: "outcomes",
      heading: "What changes for the business.",
      body: [
        "Watch time and engagement climb because the right content finds the right person. Subscription conversion improves, content operations speed up, the archive starts paying rent, and both editorial and commercial teams finally work from the same audience picture.",
      ],
    },
    {
      kind: "dynamic",
      id: "services-links",
      heading: "Built with these services.",
      note: "Cards: AI Product Development, AI Content SEO & GEO, AI E-Commerce, Dashboards & Analytics, Managed Technology Operations",
    },
    {
      kind: "rich",
      id: "proof",
      heading: "From publishers like yours.",
    },
    {
      kind: "dynamic",
      id: "proof-cards",
      note: "Case study cards from Strapi, filtered by industry tag, plus testimonial",
    },
    {
      kind: "faq",
      id: "faq",
      heading: "Asked by every content executive we meet.",
      items: [
        {
          question: "Can we afford our own streaming platform?",
          answer:
            "More often than expected. Modern infrastructure has brought the cost down dramatically, and the first call will give you an honest number against what the platforms currently take from you.",
        },
        {
          question: "Will video actually stream well on Nigerian connections?",
          answer:
            "Yes, with adaptive streaming that adjusts to each viewer's bandwidth and data-conscious options built in. We design for the connections your audience actually has.",
        },
        {
          question: "Can subscribers pay in naira with local methods?",
          answer:
            "Yes. Cards, transfers, and USSD through local gateways, with renewals and failed payment recovery handled automatically.",
        },
        {
          question: "How does the automatic captioning handle our languages?",
          answer:
            "Well for major languages and improving for others, always with an editorial review step. Honest answer: it accelerates the work, it does not replace the editor.",
        },
        {
          question: "What happens to our archive metadata mess?",
          answer:
            "The AI cataloguing makes its first pass across the whole archive, your team corrects and confirms, and the system learns your taxonomy. The mountain becomes a backlog, and the backlog ends.",
        },
      ],
    },
    {
      kind: "cta-band",
      id: "cta-band",
      heading:
        "Your archive is an asset that should be paying rent. Let us put it to work.",
      button: { label: "Talk to us about your platform", href: "/contact" },
    },
  ],
};
