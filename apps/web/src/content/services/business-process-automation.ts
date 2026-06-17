/**
 * Business Process Automation service page, transcribed verbatim from the approved Website
 * Copy (Part 2).
 */
import type { MarketingPage } from "../types.js";

export const businessProcessAutomation: MarketingPage = {
  meta: {
    slug: "/business-process-automation",
    routeClass: "service",
    title: "Business Process Automation Services | Nexoris Technologies",
    description:
      "We automate document handling, approvals, and weekly reports so your people can focus on work that needs judgement. Every project starts with a process audit.",
  },
  hero: {
    h1: "Your team is too good to spend the day on copy and paste.",
    subline:
      "We build systems that take over the repetitive, rule-based work: typing in documents, chasing approvals, matching payments, and putting together the same reports every week. We start with an audit so we automate what matters most first, and a person always reviews anything unusual.",
    primaryCta: { label: "Request a process audit", href: "/contact" },
    secondaryCta: { label: "Find the right service", href: "#solution-finder" },
  },
  sections: [
    {
      kind: "cards",
      id: "pain",
      heading: "Count how many hours your team spent on this last month.",
      cards: [
        {
          body: "Every invoice gets typed into the system by hand. Every one.",
        },
        {
          body: "The approval sat in someone's inbox for six days. The supplier called me twice.",
        },
        {
          body: "Friday afternoons are gone. That is when we build the weekly report, by hand, from four different files.",
        },
      ],
      closingLine:
        "Multiply those hours by salaries and by twelve months. That number is what doing nothing costs. The audit puts it in front of you precisely.",
    },
    {
      kind: "cards",
      id: "scope",
      heading: "What we automate.",
      cards: [
        {
          title: "Process mapping and an opportunity audit.",
          body: "We map how work actually flows through your business and rank the automation opportunities by value, so you start where the payback is biggest.",
        },
        {
          title: "Document intake and data entry.",
          body: "Invoices, forms, and records get read automatically and entered into your systems, with a person checking anything the system is unsure about.",
        },
        {
          title: "Approval workflows.",
          body: "Requests route to the right person, send reminders, and escalate when they stall, so nothing dies in an inbox.",
        },
        {
          title: "Scheduled reports and reconciliations.",
          body: "The weekly report builds itself. The accounts match themselves, and only the exceptions reach a human.",
        },
        {
          title: "Back-office automation.",
          body: "The repetitive parts of HR, finance, and operations, handled quietly and on time.",
        },
      ],
    },
    {
      kind: "cards",
      id: "ai-where-it-helps",
      heading: "Where AI makes the automation smarter.",
      cards: [
        {
          title: "Reading documents the way a person would.",
          body: "Invoices, KYC files, and contracts in mixed formats get understood, not just scanned.",
        },
        {
          title: "Spotting the unusual.",
          body: "Payments and approvals that do not fit the pattern get flagged before they go through.",
        },
        {
          title: "Routing by content.",
          body: "Work goes to the right desk based on what it actually contains, learned from how your team has handled it before.",
        },
        {
          title: "First drafts of reports and summaries.",
          body: "The numbers arrive already explained, ready for review.",
        },
      ],
      closingLine: "And anything unusual always goes to a person first.",
    },
    {
      kind: "rich",
      id: "process",
      heading: "Audit first, automate second.",
      body: [
        "We start with a process audit: a short engagement that maps your workflows, measures what each one costs, and ranks the opportunities by value and feasibility. You get the findings in plain numbers whether or not you continue with us. From there we deliver in stages, each with a measurable result, starting with the process that hurts most.",
      ],
    },
    {
      kind: "rich",
      id: "proof",
      heading: "What an automated month looks like.",
      body: [
        "Documents enter the system the day they arrive. Approvals move in hours, not days. Month-end closes faster because the reconciliation ran all month long. And the hours your team gets back go into the work that was always waiting: customers, suppliers, and the thinking nobody had time for.",
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
      heading: "Where automation pays back quickest.",
      note: "Cards: Professional Services, Fintech, Insurance, Manufacturing, NGOs",
    },
    {
      kind: "faq",
      id: "faq",
      heading: "Asked by every operations leader we meet.",
      items: [
        {
          question: "What happens to the people whose tasks get automated?",
          answer:
            "They finally get to the work that has been waiting. In our experience nobody misses retyping invoices, and the businesses that automate redeploy their people, not release them. The judgement work was always the shortage.",
        },
        {
          question: "How do we know what to automate first?",
          answer:
            "The audit answers that with numbers: what each process costs in hours, where the errors happen, and which automation pays back fastest. You start with evidence, not guesswork.",
        },
        {
          question:
            "What if the system meets something it does not understand?",
          answer:
            "It stops and asks a person. Exceptions always route to a human for review, and the system learns from what your team decides. Nothing unusual gets waved through quietly.",
        },
        {
          question: "Do we need to replace our current software?",
          answer:
            "Usually not. Most automation works on top of the tools you already have, connecting them and handling the work between them.",
        },
        {
          question: "How fast do we see results?",
          answer:
            "The first automated process is typically live within weeks of the audit, and it is deliberately the one with the fastest payback. You see the result before you commit to the rest.",
        },
      ],
    },
    {
      kind: "cta-band",
      id: "cta-band",
      heading:
        "Find out what your manual processes are costing you. The audit puts it in plain numbers.",
      button: { label: "Request a process audit", href: "/contact" },
    },
  ],
};
