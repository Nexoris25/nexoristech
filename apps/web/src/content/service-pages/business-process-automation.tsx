/**
 * Business Process Automation service page, transcribed from the approved design handoff
 * (business-process-automation.html). The hero uses the interactive manual-work cost calculator.
 * Copy, icons, and FAQ match the handoff; proof states honest "automated month" outcomes without
 * fabricated figures. Consumed by the ServiceView template.
 */
import type { ServiceContent } from "../../components/service/ServiceView.js";
import { CostCalculator } from "../../components/service/CostCalculator.js";

export const businessProcessAutomation: ServiceContent = {
  breadcrumb: "Business Process Automation",
  heroWidget: <CostCalculator />,
  hero: {
    kicker: "Automate the busywork",
    h1: "Your team is too good to spend the day on copy and paste.",
    lede: "We build systems that take over the repetitive, rule-based work: typing in documents, chasing approvals, matching payments, and putting together the same reports every week. We start with an audit so we automate what matters most first, and a person always reviews anything unusual.",
    primaryCta: { label: "Request a process audit", href: "/contact" },
    secondaryCta: { label: "Find the right service", href: "/#finder" },
    stats: [],
  },
  problem: {
    kicker: "The hidden cost",
    h2: "Count how many hours your team spent on this last month.",
    quotes: [
      {
        text: "Every invoice gets typed into the system by hand. Every one. Hours every week go into moving numbers from one place to another.",
        tag: "The data entry",
      },
      {
        text: "The approval sat in someone's inbox for six days. The supplier called me twice. Work dies quietly in inboxes nobody is watching.",
        tag: "The stalled approval",
      },
      {
        text: "Friday afternoons are gone. That is when we build the weekly report, by hand, from four different files. The same assembly, every single week.",
        tag: "The manual report",
      },
    ],
    close: (
      <>
        Multiply those hours by salaries and by twelve months. That number is what doing nothing
        costs. <b>The audit puts it in front of you precisely.</b>
      </>
    ),
  },
  scope: {
    kicker: "What we automate",
    h2: "From the audit, we work down the list by value.",
    items: [
      {
        icon: (
          <>
            <path d="M3 3v18h18" />
            <path d="M7 14l3-3 3 2 4-5" />
          </>
        ),
        title: "Process mapping and an opportunity audit",
        body: "We map how work actually flows through your business and rank the automation opportunities by value, so you start where the payback is biggest.",
      },
      {
        icon: (
          <>
            <path d="M14 3v5h5" />
            <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M9 13h6M9 16h4" />
          </>
        ),
        title: "Document intake and data entry",
        body: "Invoices, forms, and records get read automatically and entered into your systems, with a person checking anything the system is unsure about.",
      },
      {
        icon: (
          <>
            <path d="M4 6h16M4 12h16M4 18h10" />
            <circle cx="19" cy="18" r="2.4" />
          </>
        ),
        title: "Approval workflows",
        body: "Requests route to the right person, send reminders, and escalate when they stall, so nothing dies in an inbox.",
      },
      {
        icon: (
          <>
            <path d="M21 12a9 9 0 1 1-3-6.7" />
            <path d="M21 4v4h-4" />
            <path d="M9 12l2 2 4-4" />
          </>
        ),
        title: "Scheduled reports and reconciliations",
        body: "The weekly report builds itself. The accounts match themselves, and only the exceptions reach a human.",
      },
      {
        icon: (
          <>
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
          </>
        ),
        title: "Back-office automation",
        body: "The repetitive parts of HR, finance, and operations, handled quietly and on time.",
      },
    ],
  },
  ai: {
    kicker: "Where AI makes it smarter",
    h2: "Where AI makes the automation smarter.",
    intro:
      "Most automation is rule-based and needs no AI at all. But where the work involves reading, judgement, or messy inputs, AI makes it sharper, and a person still reviews anything unusual.",
    feats: [
      {
        icon: (
          <>
            <path d="M14 3v5h5" />
            <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M8 13h8M8 17h5" />
          </>
        ),
        title: "Reading documents the way a person would",
        body: "Invoices, KYC files, and contracts in mixed formats get understood, not just scanned.",
      },
      {
        icon: (
          <>
            <path d="M12 2l2.4 5 5.6.6-4.2 3.8 1.2 5.6L12 14" />
            <path d="M12 22v-8" />
          </>
        ),
        title: "Spotting the unusual",
        body: "Payments and approvals that do not fit the pattern get flagged before they go through.",
      },
      {
        icon: <path d="M3 12h6l2-4 3 8 2-4h5" />,
        title: "Routing by content",
        body: "Work goes to the right desk based on what it actually contains, learned from how your team has handled it before.",
      },
      {
        icon: (
          <>
            <path d="M4 4h16v5H4zM4 13h10v7H4z" />
            <path d="M18 13l3 3-3 3" />
          </>
        ),
        title: "First drafts of reports and summaries",
        body: "The numbers arrive already explained, ready for review.",
      },
    ],
    foot: "And anything unusual always goes to a person first.",
  },
  process: {
    h2: "Audit first, automate second.",
    steps: [
      {
        title: "Discover & Assess",
        body: "Analyse business processes, identify challenges, and uncover opportunities for strategic automation.",
      },
      {
        title: "Design the Solution",
        body: "Create intuitive workflows and scalable solutions aligned with operational goals.",
      },
      {
        title: "Build & Integrate",
        body: "Develop robust applications and integrate seamlessly with existing systems and third-party platforms.",
      },
      {
        title: "Test & Validate",
        body: "Verify functionality, security, performance, and reliability through comprehensive quality assurance.",
      },
      {
        title: "Deploy & Enable",
        body: "Launch the solution smoothly while empowering users through onboarding and training.",
      },
      {
        title: "Support & Optimise",
        body: "Continuously monitor, maintain, and enhance the solution to support evolving business needs.",
      },
    ],
    note: (
      <>
        The audit is a short engagement that maps your workflows, measures what each one costs, and
        ranks the opportunities. <b>You get the findings in plain numbers whether or not you continue
        with us.</b>
      </>
    ),
  },
  proof: {
    kicker: "What an automated month looks like",
    h2: "The hours come back, and they go where they were always needed.",
    lede: "Nothing here is a magic number. It is simply what a month looks like once the repetitive work runs itself.",
    cards: [
      { tag: "An automated month", title: "Documents enter the system the day they arrive." },
      { tag: "An automated month", title: "Approvals move in hours, not days." },
      {
        tag: "An automated month",
        title: "Month-end closes faster because the reconciliation ran all month long.",
      },
    ],
  },
  industryLinks: {
    kicker: "Industries",
    h2: "Where automation pays back quickest.",
    lede: "Automation returns the most where the same rule-based work repeats in volume, day after day.",
    links: [
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
        href: "/fintech-software",
        icon: <path d="M3 9l9-5 9 5M5 9v8M19 9v8M9 17v-5M15 17v-5M3 21h18" />,
        title: "Financial Services & Fintech",
        body: "Secure banking, payments, and onboarding built to scale.",
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
        href: "/healthcare-software",
        icon: <path d="M3 12h4l2-6 4 12 2-6h6" />,
        title: "Healthcare & Clinics",
        body: "Records, scheduling, and patient care handled with care.",
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
    ],
  },
  faq: {
    kicker: "Questions",
    h2: "Asked by every operations leader we meet.",
    lede: "The honest answers about what changes, what to automate first, and how fast you see it.",
    items: [
      {
        q: "What happens to the people whose tasks get automated?",
        a: "They finally get to the work that has been waiting. In our experience nobody misses retyping invoices, and the businesses that automate redeploy their people, not release them. The judgement work was always the shortage.",
      },
      {
        q: "How do we know what to automate first?",
        a: "The audit answers that with numbers: what each process costs in hours, where the errors happen, and which automation pays back fastest. You start with evidence, not guesswork.",
      },
      {
        q: "What if the system meets something it does not understand?",
        a: "It stops and asks a person. Exceptions always route to a human for review, and the system learns from what your team decides. Nothing unusual gets waved through quietly.",
      },
      {
        q: "Do we need to replace our current software?",
        a: "Usually not. Most automation works on top of the tools you already have, connecting them and handling the work between them.",
      },
      {
        q: "How fast do we see results?",
        a: "The first automated process is typically live within weeks of the audit, and it is deliberately the one with the fastest payback. You see the result before you commit to the rest.",
      },
    ],
  },
  cta: {
    h2: "Find out what your manual processes are costing you.",
    body: "The audit puts it in plain numbers. Tell us where the repetitive work piles up, and we will reply within one business day with a way to measure it.",
    button: { label: "Request a process audit", href: "/contact" },
  },
};
