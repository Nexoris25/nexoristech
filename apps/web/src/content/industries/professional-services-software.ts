/**
 * Professional Services industry page, transcribed verbatim from the approved Website Copy
 * (Part 3).
 */
import type { MarketingPage } from "../types.js";

export const professionalServicesSoftware: MarketingPage = {
  meta: {
    slug: "/professional-services-software",
    routeClass: "industry",
    title: "Software for Law & Accounting Firms | Nexoris Technologies",
    description:
      "Practice management, client portals, and billing tools for law, accounting, and consulting firms. Bill more of the hours your team already works every week.",
  },
  hero: {
    h1: "Capture every billable hour, including the ones slipping away right now.",
    subline:
      "We build practice management systems, client portals, and billing tools for law firms, accounting practices, and consultancies. Hours stop leaking between your calendar and your invoices, documents get drafted faster, and the firm's accumulated knowledge becomes something you can actually search.",
    primaryCta: { label: "Talk to us about your practice", href: "/contact" },
    secondaryCta: { label: "Find the right service", href: "#solution-finder" },
  },
  sections: [
    {
      kind: "cards",
      id: "pain",
      heading:
        "Your expertise is the product. Admin keeps eating the inventory.",
      cards: [
        {
          body: "The work got done. Some of it got billed. Nobody is sure about the gap.",
        },
        {
          body: "The document we need exists. It is in someone's inbox, or a drive, or a drawer.",
        },
        {
          body: "The client called for an update, and the partner spent twenty minutes reconstructing one.",
        },
        {
          body: "When she left the firm, fifteen years of knowing-how-we-do-things left with her.",
        },
      ],
      closingLine:
        "A firm sells hours and judgement. Every hour lost to admin is inventory thrown away, and the systems below are how you stop throwing it.",
    },
    {
      kind: "cards",
      id: "solutions",
      heading: "What we build for firms.",
      cards: [
        {
          title: "Practice management systems.",
          body: "Matters, clients, deadlines, and billing in one system, instead of in everyone's heads.",
        },
        {
          title: "Document and matter management.",
          body: "Every document filed against its matter, versioned, and findable in seconds.",
        },
        {
          title: "Client portals.",
          body: "Clients see status, documents, and invoices themselves, which ends the update calls.",
        },
        {
          title: "Billing and invoicing.",
          body: "Time captured properly becomes invoices that go out on time and get paid faster.",
        },
        {
          title: "Client relationship management.",
          body: "The firm's relationships managed as the assets they are.",
        },
        {
          title: "Case intake workflows.",
          body: "New matters opened consistently, with conflicts checked and nothing skipped.",
        },
        {
          title: "Searchable knowledge bases.",
          body: "The firm's precedents, opinions, and know-how organised and searchable, so experience compounds instead of evaporating.",
        },
      ],
    },
    {
      kind: "cards",
      id: "ai-where-it-helps",
      heading: "Where AI can save your team hours.",
      cards: [
        {
          title: "Contracts reviewed and key clauses extracted.",
          body: "The first pass through a hundred pages happens in minutes, with a professional doing the judging.",
        },
        {
          title: "Research assistants for law and regulation.",
          body: "Relevant authority and analysis surfaced quickly, checked by the person who signs the advice.",
        },
        {
          title: "Timesheets built from calendar and email.",
          body: "The day reconstructs itself for review, and the unbilled gap shrinks.",
        },
        {
          title: "Long documents summarised.",
          body: "The hundred-page report becomes a two-page brief, with the source one click away.",
        },
        {
          title: "Knowledge search in plain language.",
          body: '"Have we handled something like this before?" gets a real answer.',
        },
        {
          title: "First drafts of proposals and reports.",
          body: "The blank page problem handled, in the firm's own voice.",
        },
      ],
      closingLine:
        "A professional reviews everything before it goes out. The AI just gets them to the review faster.",
    },
    {
      kind: "rich",
      id: "outcomes",
      heading: "What changes by the next billing cycle.",
      body: [
        "More of the hours actually worked get billed. Documents are produced and found faster, clients get answers without chasing, drafting errors fall, and the knowledge that used to live in individual heads becomes a firm asset that stays when people move on.",
      ],
    },
    {
      kind: "dynamic",
      id: "services-links",
      heading: "Built with these services.",
      note: "Cards: Business Process Automation, AI Product Development, Chatbots & Virtual Assistants, AI Content SEO & GEO, Managed Technology Operations",
    },
    {
      kind: "rich",
      id: "proof",
      heading: "From firms like yours.",
    },
    {
      kind: "dynamic",
      id: "proof-cards",
      note: "Case study cards from Strapi, filtered by industry tag, plus testimonial",
    },
    {
      kind: "faq",
      id: "faq",
      heading: "Asked by every managing partner we meet.",
      items: [
        {
          question: "How is client confidentiality protected?",
          answer:
            "Encryption, strict role-based access by matter, and a full audit log of who saw what and when. Confidentiality is the profession, and the system is built around that fact.",
        },
        {
          question: "Will the AI tools see privileged documents?",
          answer:
            "Only inside your own controlled environment, under the access rules you set, and never to train anything outside your firm. We will walk your risk committee through the architecture in plain words.",
        },
        {
          question:
            "Can it handle our billing arrangements? They vary by client.",
          answer:
            "Yes. Hourly, fixed fee, capped, retainer, and blends of them, configured per client and matter, with the invoice following the agreement automatically.",
        },
        {
          question: "Partners are busy. Will they actually adopt it?",
          answer:
            "Adoption is a design requirement: time capture that takes seconds, search that actually finds things, and visible personal benefit in the first week. Systems partners ignore are systems that were built wrong.",
        },
        {
          question: "Can you migrate years of existing files and matters?",
          answer:
            "Yes, in a supervised process: documents, matters, and histories move over, get checked, and the old chaos is retired only when the new order is proven.",
        },
      ],
    },
    {
      kind: "cta-band",
      id: "cta-band",
      heading:
        "Find out how many billable hours your current setup is losing you. The answer usually surprises people.",
      button: { label: "Talk to us about your practice", href: "/contact" },
    },
  ],
};
