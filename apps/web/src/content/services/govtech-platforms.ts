/**
 * GovTech Platforms service page, transcribed verbatim from the approved Website Copy
 * (Part 2). This is the capability page, kept distinct from the Government and Public Sector
 * industry page (PRD 9.1).
 */
import type { MarketingPage } from "../types.js";

export const govtechPlatforms: MarketingPage = {
  meta: {
    slug: "/govtech-platforms",
    routeClass: "service",
    title: "GovTech & Public Sector Platforms | Nexoris Technologies",
    description:
      "Citizen portals, revenue collection, and case management systems built for how government really works. Accessible, transparent, and ready for procurement.",
  },
  hero: {
    h1: "Public services citizens do not have to queue for.",
    subline:
      "We build digital platforms for ministries, agencies, and regulators, covering both citizen-facing services and internal operations. We design them around procurement rules, transparency, and compliance from the start, because retrofitting those never goes well.",
    primaryCta: { label: "Request a briefing", href: "/contact" },
    secondaryCta: { label: "Find the right service", href: "#solution-finder" },
  },
  sections: [
    {
      kind: "cards",
      id: "pain",
      heading: "Citizens judge the whole government by their last queue.",
      cards: [
        { body: "The file moved between four desks. Each desk added a week." },
        {
          body: "Revenue is collected, but how much of it arrives is a different question.",
        },
        {
          body: "Two agencies hold the same record about the same citizen, and the records disagree.",
        },
      ],
      closingLine:
        "Behind every queue is a process that could move on its own. We build the systems that move it.",
    },
    {
      kind: "cards",
      id: "scope",
      heading: "The platforms we engineer.",
      intro:
        "This page is about how we build government software: the architecture, the standards, and the delivery method. If you are a ministry or agency looking for help with a specific service or revenue problem, the Government and Public Sector page speaks to that directly.",
      cards: [
        {
          title: "Platform architecture for scale.",
          body: "We design citizen platforms to handle national volumes, with the performance, redundancy, and security that public systems are held to.",
        },
        {
          title: "Identity and access at population scale.",
          body: "Verification, roles, and permissions built to handle large citizen bases and many internal users without breaking.",
        },
        {
          title: "Interoperability layers.",
          body: "Standards-based connections so a new platform exchanges data cleanly with the registries and systems already in place across government.",
        },
        {
          title: "Audit, logging, and transparency by design.",
          body: "Every action recorded and reportable, because public systems are judged on accountability as much as on function.",
        },
        {
          title: "Hosting and data residency to your rules.",
          body: "In-country and sovereign hosting options, designed around the data residency requirements you must meet, and put in writing.",
        },
        {
          title: "Accessibility and standards compliance.",
          body: "Built to recognised accessibility standards from the first screen, so the platform serves every citizen and passes review.",
        },
      ],
    },
    {
      kind: "cards",
      id: "ai-where-it-helps",
      heading: "How we engineer AI into public platforms responsibly.",
      intro:
        "On the build side, AI is added with the controls public systems require: explainability, audit trails, and a person accountable for every automated decision.",
      cards: [
        {
          title: "Document understanding at scale.",
          body: "Decades of paper records read and made searchable, engineered as a controlled pipeline rather than a black box.",
        },
        {
          title: "Explainable routing and classification.",
          body: "Cases sorted and routed automatically, with every decision traceable to the rule or signal behind it.",
        },
        {
          title: "Anomaly detection on transactions.",
          body: "Unusual patterns in collections or claims surfaced for a human officer to review, with the evidence attached.",
        },
        {
          title: "Language and accessibility tooling.",
          body: "Assistants and content tools that widen access, built so the underlying models stay inside your governance boundary.",
        },
      ],
      closingLine:
        "Every model we deploy in a public platform is explainable and logged, because a public institution must be able to show its working.",
    },
    {
      kind: "rich",
      id: "process",
      heading: "How we work with public institutions.",
      body: [
        "Public sector work fails in predictable places, so we plan for them from the start. We map the stakeholders early, including the ones who can quietly stop a project. We scope in a way that fits procurement rather than fighting it. We deliver in phases, so there is visible progress inside a budget year. And we train your own people throughout, because a platform the agency cannot run without us has failed, whatever the launch event looked like.",
      ],
    },
    {
      kind: "rich",
      id: "proof",
      heading: "What a working public platform earns.",
      body: [
        "Services delivered in days instead of weeks. Revenue performance that improves because leakage lost its hiding places. And something harder to measure but more valuable: a credible digital track record that citizens notice and the agency can build on.",
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
      heading: "Related sectors we serve.",
      note: "Cards: Government & Public Sector, NGOs, Education, Healthcare",
    },
    {
      kind: "faq",
      id: "faq",
      heading: "Asked by every public sector sponsor.",
      items: [
        {
          question: "Can you work within public procurement processes?",
          answer:
            "Yes. We scope and document in the way procurement requires, and we understand the approval rhythms that come with public work. It is part of why agencies engage us.",
        },
        {
          question: "Where is the data hosted?",
          answer:
            "Where your data sovereignty requirements say it must be. We design hosting around your rules, including in-country options, and we put it in writing.",
        },
        {
          question:
            "What happens to the platform if the administration changes?",
          answer:
            "It keeps running, because it is built on documentation, training, and full handover rather than on a relationship with us. Continuity is an explicit design goal.",
        },
        {
          question: "Can our own staff run it after launch?",
          answer:
            "Yes, and they should. Training and documentation are part of every delivery, with managed support available for as long as it is wanted rather than required.",
        },
        {
          question:
            "How do you handle citizens who do not read well or do not have smartphones?",
          answer:
            "With plain language, voice and assisted channels, and by keeping counter service working alongside digital. A citizen service that only serves the comfortable is not finished.",
        },
      ],
    },
    {
      kind: "cta-band",
      id: "cta-band",
      heading:
        "Citizens remember the agency that finally made things easy. We can help yours be that agency.",
      button: { label: "Request a briefing", href: "/contact" },
    },
  ],
};
