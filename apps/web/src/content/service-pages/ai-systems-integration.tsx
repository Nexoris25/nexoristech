/**
 * AI & Systems Integration service page, transcribed from the approved design handoff
 * (ai-systems-integration.html). The hero uses the interactive connection-board widget. Copy,
 * icons, and FAQ match the handoff; the "old system, new abilities" section is transcribed as the
 * AI feature cards, and proof states honest "connected business" outcomes without fabricated
 * figures. The platforms list is folded into the scope lede. Consumed by the ServiceView template.
 */
import type { ServiceContent } from "../../components/service/ServiceView.js";
import { ConnectionBoard } from "../../components/service/ConnectionBoard.js";

export const aiSystemsIntegration: ServiceContent = {
  breadcrumb: "AI & Systems Integration",
  heroWidget: <ConnectionBoard />,
  hero: {
    kicker: "Automate the busywork · Connected tools",
    h1: "Your tools should be talking to each other. We make that happen.",
    lede: "You probably do not need new software. You need the software you already paid for to share data on its own. We build the connections, keep them monitored, and where it helps, add smart features to systems that today only store and retrieve.",
    primaryCta: { label: "Connect my systems", href: "/contact" },
    secondaryCta: { label: "Find the right service", href: "/#finder" },
    stats: [],
  },
  problem: {
    kicker: "The retyping",
    h2: "Somebody on your team retyped the same customer details three times today.",
    quotes: [
      { text: "Sales has one number, accounting has another, and both of them came from the same orders." },
      {
        text: "Every Monday someone exports from one tool and imports into another. That is a person's job now.",
      },
      { text: "The old system works, mostly, so we keep it. And we keep working around it." },
    ],
    close: (
      <>
        You do not have a software problem. You have a plumbing problem, and{" "}
        <b>plumbing is a solved profession.</b>
      </>
    ),
  },
  scope: {
    kicker: "What we connect and build",
    h2: "What we connect and build.",
    lede: "From the tools you already run — SAP, Sage, QuickBooks, Xero, Zoho, Salesforce, HubSpot, MS Dynamics, Paystack, Flutterwave, Monnify, Remita, Shopify, WooCommerce, WhatsApp Business, and more — talking to each other at last.",
    items: [
      {
        icon: <path d="M7 8a3 3 0 0 0 0 6M17 8a3 3 0 0 1 0 6M10 11h4" />,
        title: "Connections between your core tools",
        body: "CRM, ERP, accounting, and HR systems sharing data automatically, so a record entered once exists everywhere it should.",
      },
      {
        icon: (
          <>
            <path d="M4 4v6h6M20 20v-6h-6" />
            <path d="M20 9A8 8 0 0 0 6 6M4 15a8 8 0 0 0 14 3" />
          </>
        ),
        title: "Automatic syncing and duplicate removal",
        body: "One customer, one record, everywhere, instead of three versions that almost match.",
      },
      {
        icon: (
          <>
            <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" />
            <rect x="9" y="9" width="6" height="6" rx="1.5" />
          </>
        ),
        title: "Custom middleware",
        body: "When off-the-shelf connectors fall short, we build the piece in between that makes your specific combination work.",
      },
      {
        icon: (
          <>
            <path d="M12 3l8 4v5c0 4.5-3.5 7.5-8 9-4.5-1.5-8-4.5-8-9V7z" />
            <path d="M9 12l2 2 4-4" />
          </>
        ),
        title: "Monitoring with alerts",
        body: "A broken connection announces itself the hour it breaks, instead of being discovered three weeks later in a reconciliation.",
      },
    ],
  },
  ai: {
    kicker: "Old system, new abilities",
    h2: "Keep the system. Give it abilities it was never built with.",
    intro:
      "Where it makes sense, we add intelligence on top of a system you are not ready to replace. The legacy platform keeps doing what it does well, and gains the abilities it was never built with.",
    feats: [
      {
        icon: (
          <>
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </>
        ),
        title: "Plain-language search",
        body: "Search your team can use in plain language, over the data the system already holds.",
      },
      {
        icon: (
          <>
            <path d="M3 17l6-6 4 4 8-8" />
            <path d="M21 7v5h-5" />
          </>
        ),
        title: "Predictions from your own data",
        body: "Predictions drawn from the data the system already holds, surfaced where your team already works.",
      },
      {
        icon: (
          <>
            <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
            <circle cx="12" cy="12" r="4" />
          </>
        ),
        title: "Automation around it",
        body: "Automation for the manual steps around the legacy system, without replacing it.",
      },
    ],
    foot: "Sometimes the right answer is just clean plumbing. We will tell you which one yours needs.",
  },
  process: {
    h2: "We map the data, then build in stages with monitoring on.",
    steps: [
      {
        title: "Audit how data moves",
        body: "We map what you have and how data flows today, including the manual steps everyone has stopped noticing.",
      },
      {
        title: "Rank by value",
        body: "We map the connections worth building and rank them by value, so the biggest payback comes first.",
      },
      {
        title: "Build, monitored",
        body: "We build in stages with monitoring switched on from the first connection. Your team keeps working in the tools they know.",
      },
    ],
    note: (
      <>
        We build in stages with monitoring switched on from the first connection.{" "}
        <b>Your team keeps working in the tools they already know, throughout.</b>
      </>
    ),
  },
  proof: {
    kicker: "What one connected business looks like",
    h2: "One version of the truth, in every department.",
    lede: "Nothing here is a magic number. It is simply what a business looks like once its systems agree with each other.",
    cards: [
      {
        tag: "Connected",
        title: "Reconciliation that takes minutes, because the systems agreed all month long.",
      },
      { tag: "Connected", title: "One record entered once, existing everywhere it should." },
      {
        tag: "Connected",
        title: "The Monday export-and-import job becomes work a person should actually do.",
      },
    ],
  },
  industryLinks: {
    kicker: "Industries",
    h2: "Where integration matters most.",
    lede: "Integration pays back fastest where several systems hold pieces of the same truth.",
    links: [
      {
        href: "/fintech-software",
        icon: <path d="M3 9l9-5 9 5M5 9v8M19 9v8M9 17v-5M15 17v-5M3 21h18" />,
        title: "Financial Services & Fintech",
        body: "Secure banking, payments, and onboarding built to scale.",
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
      {
        href: "/healthcare-software",
        icon: <path d="M3 12h4l2-6 4 12 2-6h6" />,
        title: "Healthcare & Clinics",
        body: "Records, scheduling, and patient care handled with care.",
      },
      {
        href: "/professional-services-software",
        icon: (
          <>
            <rect x="3" y="8" width="18" height="12" rx="2" />
            <path d="M9 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18" />
          </>
        ),
        title: "Professional Services",
        body: "Matters, clients, and billing from a single source of truth.",
      },
      {
        href: "/retail-ecommerce-software",
        icon: (
          <>
            <path d="M6 8h12l-1 12a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1L6 8z" />
            <path d="M9 8V6a3 3 0 0 1 6 0v2" />
          </>
        ),
        title: "Retail & E-Commerce",
        body: "Storefronts, inventory, and online sales that keep up with demand.",
      },
    ],
  },
  faq: {
    kicker: "Questions",
    h2: "Asked before most integration projects.",
    lede: "Vendor cooperation, risk to live systems, old software, and what happens when a connection breaks.",
    items: [
      {
        q: "Will our existing software vendor cooperate?",
        a: "Usually yes, through documented interfaces. When a vendor will not or cannot, we work with exports, scheduled transfers, or other supported routes, and we tell you the trade-offs of each in plain words before we build anything.",
      },
      {
        q: "Is it risky to connect to our live systems?",
        a: "We build and test against copies first, move data in supervised stages, and switch nothing over until both sides match. Your business keeps running throughout.",
      },
      {
        q: "Can you connect a very old system?",
        a: "Almost always. Old systems usually have some way in, and finding it is a normal part of our audit. The rare exceptions get an honest conversation about alternatives.",
      },
      {
        q: "What happens if a connection breaks later?",
        a: "Monitoring catches it and alerts us, typically before your team notices. With a managed plan we fix it as part of the service, which is why most integration clients take one.",
      },
      {
        q: "Could we just do this with manual exports?",
        a: "You could, and many businesses do, which is exactly how a person ends up spending every Monday on it. The integration pays for itself in recovered hours and in errors that stop happening.",
      },
    ],
  },
  cta: {
    h2: "Keep the tools. Lose the retyping.",
    body: "Tell us which systems refuse to talk to each other. We will reply within one business day with the connections worth building first.",
    button: { label: "Connect my systems", href: "/contact" },
  },
};
