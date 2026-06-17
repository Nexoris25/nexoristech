/**
 * AI & Systems Integration service page, transcribed verbatim from the approved Website Copy
 * (Part 2).
 */
import type { MarketingPage } from "../types.js";

export const aiSystemsIntegration: MarketingPage = {
  meta: {
    slug: "/ai-systems-integration",
    routeClass: "service",
    title: "Systems Integration Services | Nexoris Technologies",
    description:
      "We connect your CRM, ERP, accounting, and payment tools so data moves on its own, and we add smart features to the systems you already use every working day.",
  },
  hero: {
    h1: "Your tools should be talking to each other. We make that happen.",
    subline:
      "You probably do not need new software. You need the software you already paid for to share data on its own. We build the connections, keep them monitored, and where it helps, add smart features to systems that today only store and retrieve.",
    primaryCta: { label: "Connect my systems", href: "/contact" },
    secondaryCta: { label: "Find the right service", href: "#solution-finder" },
  },
  sections: [
    {
      kind: "cards",
      id: "pain",
      heading:
        "Somebody on your team retyped the same customer details three times today.",
      cards: [
        {
          body: "Sales has one number, accounting has another, and both of them came from the same orders.",
        },
        {
          body: "Every Monday someone exports from one tool and imports into another. That is a person's job now.",
        },
        {
          body: "The old system works, mostly, so we keep it. And we keep working around it.",
        },
      ],
      closingLine:
        "You do not have a software problem. You have a plumbing problem, and plumbing is a solved profession.",
    },
    {
      kind: "cards",
      id: "scope",
      heading: "What we connect and build.",
      cards: [
        {
          title: "Connections between your core tools.",
          body: "CRM, ERP, accounting, and HR systems sharing data automatically, so a record entered once exists everywhere it should.",
        },
        {
          title: "Automatic syncing and duplicate removal.",
          body: "One customer, one record, everywhere, instead of three versions that almost match.",
        },
        {
          title: "Custom middleware.",
          body: "When off-the-shelf connectors fall short, we build the piece in between that makes your specific combination work.",
        },
        {
          title: "Monitoring with alerts.",
          body: "A broken connection announces itself the hour it breaks, instead of being discovered three weeks later in a reconciliation.",
        },
      ],
    },
    {
      kind: "rich",
      id: "integrations",
      heading: "Platforms we connect regularly.",
      body: [
        "Accounting and ERP: SAP, Sage, QuickBooks, Xero, Zoho. Sales and customer tools: Salesforce, HubSpot, Microsoft Dynamics. Payments: Paystack, Flutterwave, Monnify, Remita. Commerce: Shopify, WooCommerce, Magento. Messaging: WhatsApp Business, Twilio, SendGrid. If your tool is not on this list, it almost certainly has an interface we can work with, and we will confirm that before any commitment.",
      ],
    },
    {
      kind: "rich",
      id: "ai-where-it-helps",
      heading: "Old system, new abilities.",
      body: [
        "Where it makes sense, we add intelligence on top of a system you are not ready to replace: search your team can use in plain language, predictions drawn from the data the system already holds, or automation for the manual steps around it. The legacy platform keeps doing what it does well, and gains the abilities it was never built with.",
      ],
    },
    {
      kind: "rich",
      id: "process",
      heading: "How an integration project runs.",
      body: [
        "We audit what you have and how data actually moves between systems today, including the manual steps everyone has stopped noticing. Then we map the connections worth building, rank them by value, and build in stages, with monitoring switched on from the first connection. Your team keeps working in the tools they know. The retyping just stops.",
      ],
    },
    {
      kind: "rich",
      id: "proof",
      heading: "What one connected business looks like.",
      body: [
        "One version of the truth, in every department. Reconciliation that takes minutes, because the systems agreed all month long. And the person who used to spend Mondays exporting and importing now does something a person should do.",
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
      heading: "Where integration matters most.",
      note: "Cards: Retail, Manufacturing, Fintech, Logistics, Professional Services",
    },
    {
      kind: "faq",
      id: "faq",
      heading: "Asked before most integration projects.",
      items: [
        {
          question: "Will our existing software vendor cooperate?",
          answer:
            "Usually yes, through documented interfaces. When a vendor will not or cannot, we work with exports, scheduled transfers, or other supported routes, and we tell you the trade-offs of each in plain words before we build anything.",
        },
        {
          question: "Is it risky to connect to our live systems?",
          answer:
            "We build and test against copies first, move data in supervised stages, and switch nothing over until both sides match. Your business keeps running throughout.",
        },
        {
          question: "Can you connect a very old system?",
          answer:
            "Almost always. Old systems usually have some way in, and finding it is a normal part of our audit. The rare exceptions get an honest conversation about alternatives.",
        },
        {
          question: "What happens if a connection breaks later?",
          answer:
            "Monitoring catches it and alerts us, typically before your team notices. With a managed plan we fix it as part of the service, which is why most integration clients take one.",
        },
        {
          question: "Could we just do this with manual exports?",
          answer:
            "You could, and many businesses do, which is exactly how a person ends up spending every Monday on it. The integration pays for itself in recovered hours and in errors that stop happening.",
        },
      ],
    },
    {
      kind: "cta-band",
      id: "cta-band",
      heading: "Keep the tools. Lose the retyping.",
      button: { label: "Connect my systems", href: "/contact" },
    },
  ],
};
