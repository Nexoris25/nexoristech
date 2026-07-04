/**
 * GovTech Platforms service page, transcribed from the approved design handoff
 * (govtech-platforms.html). The hero uses the interactive citizen service-request tracker. Copy,
 * icons, and FAQ match the handoff; the responsible-AI section is transcribed as four AI feature
 * cards, and proof states honest "what it earns" outcomes without fabricated figures. Consumed by
 * the ServiceView template.
 */
import type { ServiceContent } from "../../components/service/ServiceView.js";
import { RequestTracker } from "../../components/service/RequestTracker.js";

export const govtechPlatforms: ServiceContent = {
  breadcrumb: "GovTech Platforms",
  heroWidget: <RequestTracker />,
  hero: {
    kicker: "Build new software · Public sector",
    h1: "Public services citizens do not have to queue for.",
    lede: "We build digital platforms for ministries, agencies, and regulators, covering both citizen-facing services and internal operations. We design them around procurement rules, transparency, and compliance from the start, because retrofitting those never goes well.",
    primaryCta: { label: "Request a briefing", href: "/contact" },
    secondaryCta: { label: "Find the right service", href: "/#finder" },
    stats: [],
  },
  problem: {
    kicker: "The last queue",
    h2: "Citizens judge the whole government by their last queue.",
    quotes: [
      {
        text: "The file moved between four desks. Each desk added a week. Work crawls because no system moves it from one stage to the next.",
        tag: "Stalled processes",
      },
      {
        text: "Revenue is collected, but how much of it arrives is a different question. Without a clean trail, money goes missing between payment and the books.",
        tag: "Revenue leakage",
      },
      {
        text: "Two agencies hold the same record about the same citizen, and the records disagree. The same data lives in many places, and none of them match.",
        tag: "Fragmented records",
      },
    ],
    close: (
      <>
        Behind every queue is a process that could move on its own. <b>We build the systems that move
        it.</b>
      </>
    ),
  },
  scope: {
    kicker: "What we build",
    h2: "The platforms we engineer.",
    lede: (
      <>
        This page is about how we build government software: the architecture, the standards, and the
        delivery method. If you are a ministry or agency looking for help with a specific service or
        revenue problem, the <a href="/government-digital-solutions/">Government &amp; Public Sector</a>{" "}
        page speaks to that directly.
      </>
    ),
    items: [
      {
        icon: (
          <>
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
          </>
        ),
        title: "Platform architecture for scale",
        body: "Citizen platforms designed for national volumes, with the performance, redundancy, and security public systems are held to.",
      },
      {
        icon: (
          <>
            <circle cx="9" cy="8" r="3.4" />
            <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
            <path d="M16 11l2 2 4-4" />
          </>
        ),
        title: "Identity and access at population scale",
        body: "Verification, roles, and permissions built to handle large citizen bases and many internal users without breaking.",
      },
      {
        icon: <path d="M8 7H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h3M16 7h3a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-3M8 12h8" />,
        title: "Interoperability layers",
        body: "Standards-based connections so a new platform exchanges data cleanly with the registries already in place across government.",
      },
      {
        icon: (
          <>
            <path d="M4 4h16v12H4z" />
            <path d="M7 8h6M7 12h10M4 20h16" />
          </>
        ),
        title: "Audit, logging, and transparency by design",
        body: "Every action recorded and reportable, because public systems are judged on accountability as much as on function.",
      },
      {
        icon: (
          <>
            <path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z" />
            <path d="M12 7v6M9 10h6" />
          </>
        ),
        title: "Hosting and data residency to your rules",
        body: "In-country and sovereign hosting options, designed around the data residency requirements you must meet, and put in writing.",
      },
      {
        icon: (
          <>
            <circle cx="12" cy="12" r="9" />
            <path d="M3.5 9h17M3.5 15h17M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18z" />
          </>
        ),
        title: "Accessibility and standards compliance",
        body: "Built to recognised accessibility standards from the first screen, so the platform serves every citizen and passes review.",
      },
    ],
  },
  ai: {
    kicker: "Responsible by design",
    h2: "How we engineer AI into public platforms responsibly.",
    intro:
      "On the build side, AI is added with the controls public systems require: explainability, audit trails, and a person accountable for every automated decision.",
    feats: [
      {
        icon: (
          <>
            <path d="M4 4h16v16H4z" />
            <path d="M8 8h8M8 12h8M8 16h5" />
          </>
        ),
        title: "Document understanding at scale",
        body: "Decades of paper records read and made searchable, engineered as a controlled pipeline rather than a black box.",
      },
      {
        icon: <path d="M3 12h6l2-4 3 8 2-4h5" />,
        title: "Explainable routing and classification",
        body: "Cases sorted and routed automatically, with every decision traceable to the rule or signal behind it.",
      },
      {
        icon: (
          <>
            <path d="M3 17l5-5 4 3 5-7 4 5" />
            <circle cx="8" cy="12" r="1.4" fill="currentColor" stroke="none" />
          </>
        ),
        title: "Anomaly detection on transactions",
        body: "Unusual patterns in collections or claims surfaced for a human officer to review, with the evidence attached.",
      },
      {
        icon: (
          <>
            <path d="M5 8h14M5 12h9M5 16h6" />
            <path d="M17 14l3 3-3 3" />
          </>
        ),
        title: "Language and accessibility tooling",
        body: "Assistants and content tools that widen access, built so the underlying models stay inside your governance boundary.",
      },
    ],
    foot: "Every model we deploy in a public platform is explainable and logged, because a public institution must be able to show its working.",
  },
  process: {
    h2: "How we work with public institutions.",
    steps: [
      {
        title: "Map stakeholders early",
        body: "Including the ones who can quietly stop a project, before they do.",
      },
      {
        title: "Scope to fit procurement",
        body: "We document in the way procurement requires, rather than fighting it.",
      },
      {
        title: "Deliver in phases",
        body: "Visible progress inside a budget year, not one distant launch.",
      },
      {
        title: "Train your own people",
        body: "A platform the agency cannot run without us has failed, whatever the launch looked like.",
      },
    ],
    note: (
      <>
        Public sector work fails in predictable places, so we plan for them from the start.{" "}
        <b>Stakeholders, procurement, phasing, and handover, all built into the plan.</b>
      </>
    ),
  },
  proof: {
    kicker: "What it earns",
    h2: "What a working public platform earns.",
    lede: "Nothing here is a magic number. It is what a public platform earns once the queue moves on its own.",
    cards: [
      { tag: "What it earns", title: "Services delivered in days instead of weeks." },
      {
        tag: "What it earns",
        title: "Revenue performance improves because leakage lost its hiding places.",
      },
      {
        tag: "What it earns",
        title: "A credible digital track record citizens notice and the agency can build on.",
      },
    ],
  },
  industryLinks: {
    kicker: "Sectors",
    h2: "Related sectors we serve.",
    lede: "The same engineering discipline carries across the sectors where trust and scale both matter.",
    links: [
      {
        href: "/government-digital-solutions",
        icon: <path d="M3 9l9-5 9 5M5 9v9M19 9v9M9 18v-6M15 18v-6M3 21h18" />,
        title: "Government & Public Sector",
        body: "Citizen services and registries that issue in days, not months.",
      },
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
        href: "/education-software",
        icon: (
          <>
            <path d="M12 4L2 9l10 5 8-4v6" />
            <path d="M6 12v4c0 1.3 2.7 3 6 3s6-1.7 6-3v-4" />
          </>
        ),
        title: "Education & EdTech",
        body: "Enrolment, learning, and fees managed for schools and platforms.",
      },
      {
        href: "/ngo-software",
        icon: (
          <>
            <path d="M11 7.5c-1.2-1.6-4-1-4 1.2 0 1.8 2.6 3.3 4 4.3 1.4-1 4-2.5 4-4.3 0-2.2-2.8-2.8-4-1.2z" />
            <path d="M3 14l4-1 4 2 4-1 5 2v3l-5-1-4 2-8-3z" />
          </>
        ),
        title: "NGOs & Non-Profits",
        body: "Programmes, donors, and impact reported with confidence.",
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
    ],
  },
  faq: {
    kicker: "Questions",
    h2: "Asked by every public sector sponsor.",
    lede: "The honest answers about procurement, data residency, and continuity.",
    items: [
      {
        q: "Can you work within public procurement processes?",
        a: "Yes. We scope and document in the way procurement requires, and we understand the approval rhythms that come with public work. It is part of why agencies engage us.",
      },
      {
        q: "Where is the data hosted?",
        a: "Where your data sovereignty requirements say it must be. We design hosting around your rules, including in-country options, and we put it in writing.",
      },
      {
        q: "What happens to the platform if the administration changes?",
        a: "It keeps running, because it is built on documentation, training, and full handover rather than on a relationship with us. Continuity is an explicit design goal.",
      },
      {
        q: "Can our own staff run it after launch?",
        a: "Yes, and they should. Training and documentation are part of every delivery, with managed support available for as long as it is wanted rather than required.",
      },
      {
        q: "How do you handle citizens who do not read well or do not have smartphones?",
        a: "With plain language, voice and assisted channels, and by keeping counter service working alongside digital. A citizen service that only serves the comfortable is not finished.",
      },
    ],
  },
  cta: {
    h2: "Citizens remember the agency that finally made things easy.",
    body: "Tell us which service generates your longest queue. We will reply within one business day to arrange a briefing on how to move it online.",
    button: { label: "Request a briefing", href: "/contact" },
  },
};
