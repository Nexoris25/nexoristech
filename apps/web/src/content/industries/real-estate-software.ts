/**
 * Real Estate & Property Management industry page, transcribed verbatim from the approved
 * Website Copy (Part 3).
 */
import type { MarketingPage } from "../types.js";

export const realEstateSoftware: MarketingPage = {
  meta: {
    slug: "/real-estate-software",
    routeClass: "industry",
    title: "Real Estate Software in Nigeria | Nexoris Technologies",
    description:
      "Listing portals, agent CRM, tenant portals, and facility tools for developers and property managers. Close deals faster and collect every rent payment on time.",
  },
  hero: {
    h1: "Move from first enquiry to signed keys faster than the agency next door.",
    subline:
      "We build listing portals, agent CRMs, and tenant systems for developers, agencies, and property managers. Hot leads get answered before they cool, rent arrives on time with the books already balanced, and every transaction leaves a proper paper trail.",
    primaryCta: { label: "Talk to us about your portfolio", href: "/contact" },
    secondaryCta: { label: "Find the right service", href: "#solution-finder" },
  },
  sections: [
    {
      kind: "cards",
      id: "pain",
      heading:
        "The lead was hot on Tuesday. By Friday it belonged to someone else.",
      cards: [
        {
          body: "Our listings live in WhatsApp groups, and finding one means scrolling.",
        },
        {
          body: "Enquiries come in, somebody replies eventually, and nobody tracks what happened next.",
        },
        {
          body: "Rent collection means calls, transfers with no description, and a reconciliation headache.",
        },
        {
          body: "The maintenance request from three weeks ago is still a maintenance request.",
        },
      ],
      closingLine:
        "In this market, speed and records win deals. The systems below give you both without hiring anyone new.",
    },
    {
      kind: "cards",
      id: "solutions",
      heading: "What we build for property businesses.",
      cards: [
        {
          title: "Listing portals and apps.",
          body: "Your properties presented properly, searchable, and current, on web and mobile.",
        },
        {
          title: "CRM for agents.",
          body: "Every enquiry captured, assigned, and followed up, with nothing left to memory.",
        },
        {
          title: "Tenant and landlord portals.",
          body: "Rent, receipts, documents, and requests in one place both sides can see.",
        },
        {
          title: "Facility management.",
          body: "The buildings you manage, with their schedules, vendors, and costs, under control.",
        },
        {
          title: "Maintenance ticketing.",
          body: "Requests logged, assigned, tracked, and closed, with the tenant informed throughout.",
        },
        {
          title: "Virtual tour integration.",
          body: "Serious buyers walk the property from their phone before they spend a Saturday on traffic.",
        },
        {
          title: "Lease and sales documents generated automatically.",
          body: "Agreements produced from the record in minutes, consistent every time.",
        },
      ],
    },
    {
      kind: "cards",
      id: "ai-where-it-helps",
      heading: "Where AI can shorten the cycle.",
      cards: [
        {
          title: "Property matching.",
          body: "Each buyer gets shown the properties that actually fit what they asked for.",
        },
        {
          title: "Lead scoring.",
          body: "Agents call the enquiries most likely to close, first.",
        },
        {
          title: "An enquiry chatbot.",
          body: "Questions answered and viewings booked instantly, including at 10pm when buyers actually browse.",
        },
        {
          title: "Price guidance.",
          body: "Asking prices benchmarked against the market, so listings price to sell rather than to sit.",
        },
        {
          title: "Document checks.",
          body: "IDs and title documents read and verified automatically during KYC.",
        },
        {
          title: "Tenant churn warnings.",
          body: "The tenant likely to leave gets flagged while a renewal conversation can still happen.",
        },
      ],
      closingLine: "Use the ones that fit your operation. Skip the rest.",
    },
    {
      kind: "rich",
      id: "outcomes",
      heading: "What changes by next quarter.",
      body: [
        "Sales and letting cycles shorten because responses come in minutes. More enquiries become deals because none of them fall through the cracks. Rent arrives on time with reconciliation already done, tenants stay longer because requests get handled, and every transaction leaves a record you can stand behind.",
      ],
    },
    {
      kind: "dynamic",
      id: "services-links",
      heading: "Built with these services.",
      note: "Cards: AI Product Development, Chatbots & Virtual Assistants, AI Content SEO & GEO, Business Process Automation, Managed Technology Operations",
    },
    {
      kind: "rich",
      id: "proof",
      heading: "From property businesses like yours.",
    },
    {
      kind: "dynamic",
      id: "proof-cards",
      note: "Case study cards from Strapi, filtered by industry tag, plus testimonial",
    },
    {
      kind: "faq",
      id: "faq",
      heading: "Asked by every developer and agent we meet.",
      items: [
        {
          question: "Can tenants pay rent through the system?",
          answer:
            "Yes, through Nigerian payment gateways, with every payment landing against the right tenant and property automatically. The reconciliation headache simply ends.",
        },
        {
          question: "We are a small agency. Is this overkill?",
          answer:
            "No. A small agency with fast responses and clean records outcompetes a big one without them. The system is scoped to your size and grows with you.",
        },
        {
          question: "Can it handle a portfolio with multiple landlords?",
          answer:
            "Yes. Each landlord sees their own properties, statements, and documents, and you manage everything from one place.",
        },
        {
          question: "Does it integrate with property listing sites?",
          answer:
            "Yes. Listings publish from one source to your site and the portals you use, so updating in five places becomes updating in one.",
        },
        {
          question: "What about document security for titles and agreements?",
          answer:
            "Documents are encrypted, access is role-based, and every view and change is logged. In property, the paper trail is the business, and we treat it that way.",
        },
      ],
    },
    {
      kind: "cta-band",
      id: "cta-band",
      heading:
        "Respond first and you usually close first. Let us make you the fastest responder in your market.",
      button: { label: "Talk to us about your portfolio", href: "/contact" },
    },
  ],
};
