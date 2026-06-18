/**
 * Government & Public Sector industry page, transcribed verbatim from the approved Website
 * Copy (Part 3). The sector page, kept distinct from the GovTech Platforms capability page
 * (PRD 9.1).
 */
import type { MarketingPage } from "../types.js";

export const governmentDigitalSolutions: MarketingPage = {
  meta: {
    slug: "/government-digital-solutions",
    routeClass: "industry",
    title: "Government Digital Solutions | Nexoris Technologies",
    description:
      "Citizen portals, revenue collection, and case management for ministries, agencies, and councils. Faster service for citizens and fuller revenue for the agency.",
  },
  hero: {
    h1: "Give citizens service they will actually thank you for.",
    subline:
      "We build citizen portals, revenue systems, and case management platforms for ministries, agencies, and councils. Services move faster, revenue stops leaking, and citizens can get answers in English, Pidgin, Yoruba, Hausa, or Igbo without standing in a queue.",
    primaryCta: { label: "Request a briefing", href: "/contact" },
    secondaryCta: { label: "Find the right service", href: "#solution-finder" },
  },
  sections: [
    {
      kind: "cards",
      id: "pain",
      heading:
        "Paper processes cost the agency twice: once in revenue, once in trust.",
      cards: [
        {
          body: "The application is somewhere between the third desk and the fourth.",
        },
        {
          body: "What was collected and what was remitted are two different numbers, and the gap has friends.",
        },
        {
          body: "The agency next door holds the record we need, and getting it takes a letter.",
        },
        {
          body: "Half the citizens we serve cannot navigate the forms we publish.",
        },
      ],
      closingLine:
        "Every one of these is a process problem wearing a people costume. Fix the process, and both the citizens and the staff feel it within months.",
    },
    {
      kind: "cards",
      id: "solutions",
      heading: "What we deliver for your agency.",
      intro:
        "This page is about your sector and the problems your agency faces day to day. If you want the technical detail of how we engineer these platforms, the GovTech Platforms page covers that.",
      cards: [
        {
          title: "Citizen self-service for your busiest services.",
          body: "Start with the service that generates the longest queues, and move it to a phone: applications, payments, and status checks, with the counter kept for cases that truly need one.",
        },
        {
          title: "Revenue that arrives and reconciles.",
          body: "Collections moved onto proper channels and matched automatically, so what is collected and what is remitted finally agree.",
        },
        {
          title: "Case management your staff will use.",
          body: "Files that move desk to desk digitally, with each step timed and visible, so nothing sits forgotten in a drawer for weeks.",
        },
        {
          title: "Registries and licensing that issue in days.",
          body: "The records and approvals your agency owns, made searchable and quick to issue, with the audit trail built in.",
        },
        {
          title: "Cross-agency record sharing.",
          body: "One consistent citizen record, shared with the agencies you work with on agreed rules, instead of by letter and photocopier.",
        },
        {
          title: "Transparency the public can see.",
          body: "Performance and spending published by design, which is the cheapest credibility an agency can earn.",
        },
      ],
    },
    {
      kind: "cards",
      id: "ai-where-it-helps",
      heading: "Where AI can serve your citizens and your officers.",
      intro:
        "For your agency, AI earns its place where it shortens a queue, recovers revenue, or reaches a citizen who could not be served before.",
      cards: [
        {
          title: "Assistants in five languages.",
          body: "Citizens ask in English, Pidgin, Yoruba, Hausa, or Igbo and get a clear answer without a journey to your office.",
        },
        {
          title: "Old archives made useful.",
          body: "Your back catalogue of paper records scanned and made searchable, so your officers stop hunting through storerooms.",
        },
        {
          title: "Leakage flagged on collections.",
          body: "The collection pattern that does not look right is raised for review while the sum is still small.",
        },
        {
          title: "Cases moved to the right desk.",
          body: "Each file routed to the officer who should handle it, with the urgent ones moved to the front of the queue.",
        },
        {
          title: "Service designed for every citizen.",
          body: "Plain words, icons, and voice options so citizens with low literacy or no smartphone are still served.",
        },
      ],
      closingLine:
        "Added only where it serves the public, never for show, and always with an officer accountable for the outcome.",
    },
    {
      kind: "rich",
      id: "outcomes",
      heading: "What changes for the agency and the public.",
      body: [
        "Services that took weeks take days, and citizens notice. Revenue performance improves because leakage lost its hiding places. Transparency becomes demonstrable rather than claimed, staff carry less drudgery, and the agency builds a digital track record it can stand on in any review.",
      ],
    },
    {
      kind: "dynamic",
      id: "services-links",
      heading: "Built with these services.",
      note: "Cards: GovTech Platforms, Business Process Automation, Data Infrastructure & AI Readiness, Dashboards & Analytics, Managed Technology Operations",
    },
    {
      kind: "rich",
      id: "proof",
      heading: "From institutions like yours.",
    },
    {
      kind: "dynamic",
      id: "proof-cards",
      note: "Case study cards from Strapi, filtered by industry tag",
    },
    {
      kind: "faq",
      id: "faq",
      heading: "Asked by every public sector sponsor we meet.",
      items: [
        {
          question: "Can you work within our procurement process?",
          answer:
            "Yes. We scope, document, and deliver in the way public procurement requires, and we plan phases to show visible progress within budget years.",
        },
        {
          question: "Where will the data be hosted?",
          answer:
            "Wherever your data sovereignty rules require, including in-country options, agreed in writing before anything is built.",
        },
        {
          question: "Will the system survive a change of administration?",
          answer:
            "Yes, by design: full documentation, trained staff, and complete handover mean the platform belongs to the institution, not to a vendor relationship.",
        },
        {
          question:
            "How do you serve citizens without smartphones or strong literacy?",
          answer:
            "Plain language, voice and assisted channels, and counters that keep working alongside digital. Inclusion is a requirement, not a feature.",
        },
        {
          question: "Can our own ICT staff run it after delivery?",
          answer:
            "Yes, and they should. Training and documentation are part of delivery, with our managed support available as a choice rather than a dependency.",
        },
      ],
    },
    {
      kind: "cta-band",
      id: "cta-band",
      heading:
        "Citizens remember the agency that finally made things easy. Yours can be that agency.",
      button: { label: "Request a briefing", href: "/contact" },
    },
  ],
};
