/**
 * Construction & Engineering industry page, transcribed verbatim from the approved Website
 * Copy (Part 3).
 */
import type { MarketingPage } from "../types.js";

export const constructionSoftware: MarketingPage = {
  meta: {
    slug: "/construction-software",
    routeClass: "industry",
    title: "Construction Management Software | Nexoris Technologies",
    description:
      "Project platforms, site reporting apps, and procurement tools for construction firms. Spot cost and schedule problems early, and deliver projects on budget.",
  },
  hero: {
    h1: "See every site clearly and catch overruns while they are still small.",
    subline:
      "We build project platforms, site reporting apps, and procurement tools for construction firms and contractors. Field reports stop living on WhatsApp, progress rolls up across every site, and the early signs of an overrun show up while they are still cheap to fix.",
    primaryCta: { label: "Talk to us about your projects", href: "/contact" },
    secondaryCta: { label: "Find the right service", href: "#solution-finder" },
  },
  sections: [
    {
      kind: "cards",
      id: "pain",
      heading:
        "Overruns start small and quiet. By the time they are loud, they are expensive.",
      cards: [
        {
          body: "The site report is a WhatsApp voice note and four photos. That is the official record.",
        },
        {
          body: "We found out about the cost overrun at the point where it could no longer be fixed, only paid.",
        },
        {
          body: "Materials were ordered twice for one site and not at all for another.",
        },
        {
          body: "The safety incident got handled. Whether it got recorded is another question.",
        },
      ],
      closingLine:
        "Construction punishes late information more than almost any other business. The system below makes information arrive early, from every site, every day.",
    },
    {
      kind: "cards",
      id: "solutions",
      heading: "What we build for construction.",
      cards: [
        {
          title: "Project management platforms.",
          body: "Programmes, budgets, and progress for every project in one place, rolled up for the executives and detailed for the site.",
        },
        {
          title: "Site reporting apps.",
          body: "Daily reports, photos, and issues captured on the phone in minutes, filed properly forever.",
        },
        {
          title: "Procurement and bid management.",
          body: "Requests, quotes, orders, and deliveries tracked, so double orders and missing materials both end.",
        },
        {
          title: "Stock and equipment tracking.",
          body: "What is on which site, and what it is doing there.",
        },
        {
          title: "Subcontractor portals.",
          body: "Scopes, programmes, and valuations managed in one place both sides can see.",
        },
        {
          title: "Drawing and document control.",
          body: "One current version of every drawing, with the history behind it.",
        },
        {
          title: "Daily progress dashboards.",
          body: "Yesterday, across every site, on one screen this morning.",
        },
      ],
    },
    {
      kind: "cards",
      id: "ai-where-it-helps",
      heading: "Where AI can protect the budget.",
      cards: [
        {
          title: "Cost estimates with risk flagged early.",
          body: "The line items most likely to blow out get attention before they do.",
        },
        {
          title: "Schedule slippage forecast.",
          body: "Today's small delays projected forward honestly, while recovery is still cheap.",
        },
        {
          title: "Site cameras that watch for safety.",
          body: "Missing helmets and unsafe situations flagged as they happen.",
        },
        {
          title: "Daily reports written automatically.",
          body: "The day's site data assembled into the report, for the engineer to confirm.",
        },
        {
          title: "Drawing version checks.",
          body: "The team gets warned when work references a superseded drawing.",
        },
      ],
      closingLine:
        "The basics done well come first. These sit on top when you are ready.",
    },
    {
      kind: "rich",
      id: "outcomes",
      heading: "What changes across the portfolio.",
      body: [
        "Projects land closer to schedule and budget because problems surfaced in week two instead of month six. The safety record improves and is provable. Executives see every site without driving to it, and the documentation behind each payment milestone is complete the day it is needed.",
      ],
    },
    {
      kind: "dynamic",
      id: "services-links",
      heading: "Built with these services.",
      note: "Cards: AI Product Development, IoT Development, Dashboards & Analytics, Business Process Automation, Managed Technology Operations",
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
      heading: "Asked by every project director we meet.",
      items: [
        {
          question: "Will site engineers actually use the reporting app?",
          answer:
            "Yes, if it costs them less time than the WhatsApp ritual it replaces, which is the design target: a daily report in under five minutes, photos included, even offline.",
        },
        {
          question: "Does it work on remote sites with poor coverage?",
          answer:
            "Yes. Everything captures offline and syncs when the signal returns. Site reality is the design assumption.",
        },
        {
          question:
            "Can subcontractors be on the system without seeing everything?",
          answer:
            "Yes. Each subcontractor sees their own scope, programme, and valuations and nothing else. Access follows the contract.",
        },
        {
          question:
            "Can it produce the documentation for payment certificates and claims?",
          answer:
            "Yes. Progress records, photos, and approvals accumulate against the programme as work happens, so the evidence for a valuation is assembled before anyone asks for it.",
        },
        {
          question:
            "We run projects of very different sizes. Does one system fit?",
          answer:
            "Yes. Small projects use a light slice of the same platform, large ones use all of it, and the executives see everything in one view either way.",
        },
      ],
    },
    {
      kind: "cta-band",
      id: "cta-band",
      heading:
        "The cheapest overrun is the one you catch in week two. Let us build the system that catches it.",
      button: { label: "Talk to us about your projects", href: "/contact" },
    },
  ],
};
