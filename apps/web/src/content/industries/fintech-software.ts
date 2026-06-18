/**
 * Financial Services & Fintech industry page, transcribed verbatim from the approved Website
 * Copy (Part 3).
 */
import type { MarketingPage } from "../types.js";

export const fintechSoftware: MarketingPage = {
  meta: {
    slug: "/fintech-software",
    routeClass: "industry",
    title: "Fintech Software Development | Nexoris Technologies",
    description:
      "Digital banking apps, loan systems, and agent platforms for microfinance banks and fintechs in Nigeria. Faster onboarding and stronger fraud control, by design.",
  },
  hero: {
    h1: "Software that satisfies your regulators and your customers at the same time.",
    subline:
      "We build digital banking apps, lending systems, and agent platforms for microfinance banks, fintechs, and cooperatives. Customers get onboarded in minutes instead of days, fraud gets caught earlier, and regulatory reporting stops being a monthly emergency.",
    primaryCta: { label: "Talk to us about your platform", href: "/contact" },
    secondaryCta: { label: "Find the right service", href: "#solution-finder" },
  },
  sections: [
    {
      kind: "cards",
      id: "pain",
      heading:
        "Slow onboarding loses customers. Weak controls lose money. You are asked to fix both at once.",
      cards: [
        {
          body: "Opening an account takes days of back and forth. Customers give up halfway.",
        },
        {
          body: "The loan book is growing, and so is the part of it that worries us.",
        },
        {
          body: "Reconciling across payment processors is somebody's entire week, every week.",
        },
        {
          body: "The CBN report is due, and assembling it is a fire drill every single time.",
        },
      ],
      closingLine:
        "The institutions winning this market are not braver. They are better instrumented. That is a buildable advantage.",
    },
    {
      kind: "cards",
      id: "solutions",
      heading: "What we build for financial services.",
      cards: [
        {
          title: "Digital banking apps.",
          body: "Accounts, transfers, bills, and savings in a clean app your customers actually enjoy using.",
        },
        {
          title: "Loan management and collections.",
          body: "Origination through repayment in one system, with the portfolio visible at every stage.",
        },
        {
          title: "Agent banking apps.",
          body: "Your agent network onboarding customers and moving cash, with float and fraud both under control.",
        },
        {
          title: "Connections to core banking.",
          body: "New digital channels speaking properly to the core you already run.",
        },
        {
          title: "Customer onboarding portals.",
          body: "KYC done in minutes, documents verified, compliance evidenced.",
        },
        {
          title: "Merchant dashboards.",
          body: "Your business customers seeing their payments clearly, which keeps them yours.",
        },
        {
          title: "Regulatory reporting tools.",
          body: "CBN and SEC reports assembled from live data instead of month-end heroics.",
        },
      ],
    },
    {
      kind: "cards",
      id: "ai-where-it-helps",
      heading: "Where AI can protect the book.",
      cards: [
        {
          title: "Credit scoring beyond the bureau file.",
          body: "Repayment behaviour, transactions, and alternative data turned into decisions for customers the bureaus barely know.",
        },
        {
          title: "Transactions sorted and flagged in real time.",
          body: "The unusual one gets stopped for review, while the customer's normal day stays smooth.",
        },
        {
          title: "Fraud and money-laundering alerts.",
          body: "Patterns watched continuously, raised early, and documented for compliance.",
        },
        {
          title: "A conversational banking assistant.",
          body: "Balances, transfers, and questions handled in chat, in the customer's own language.",
        },
        {
          title: "Loan decisions supported by data.",
          body: "Underwriting that is faster and more consistent, with humans on every edge case.",
        },
        {
          title: "Early warning on leaving customers.",
          body: "The account going quiet gets noticed while a call can still matter.",
        },
        {
          title: "Documents verified automatically.",
          body: "IDs and statements checked in seconds during onboarding.",
        },
      ],
      closingLine:
        "Every model we deploy is explainable, because your regulator will ask.",
    },
    {
      kind: "rich",
      id: "outcomes",
      heading: "What changes on the numbers that matter.",
      body: [
        "Onboarding drops from days to minutes, and completion rates jump with it. Loans disburse faster while the non-performing share trends down. Fraud losses shrink because the patterns get caught early. Reports go out on time from live data, and your reach extends through digital and agent channels far beyond the branches.",
      ],
    },
    {
      kind: "dynamic",
      id: "services-links",
      heading: "Built with these services.",
      note: "Cards: AI Product Development, Data Infrastructure & AI Readiness, Business Process Automation, AI & Systems Integration, Managed Technology Operations",
    },
    {
      kind: "rich",
      id: "proof",
      heading: "From institutions like yours.",
    },
    {
      kind: "dynamic",
      id: "proof-cards",
      note: "Case study cards from Strapi, filtered by industry tag, plus testimonial",
    },
    {
      kind: "faq",
      id: "faq",
      heading: "Asked by every fintech founder and MD we meet.",
      items: [
        {
          question: "How do you approach security?",
          answer:
            "As the first requirement, not a feature. Encryption everywhere, role-based access, full audit trails, and architecture reviewed against the standards your regulator and partners expect. We are happy to walk your security team through all of it.",
        },
        {
          question: "Can you integrate with our core banking system?",
          answer:
            "Yes. We build digital channels on top of the cores institutions already run, through their supported interfaces, and we confirm feasibility before any commitment.",
        },
        {
          question: "Will the credit scoring satisfy our board and regulator?",
          answer:
            "The models are explainable by design: every decision can show its reasons. Black-box lending is a regulatory problem waiting to happen, so we do not build it.",
        },
        {
          question: "How fast can a product launch?",
          answer:
            "A focused first version typically ships in months, not years, with the platform built to add products after it. Speed comes from scope discipline, not skipped controls.",
        },
        {
          question: "Do you understand CBN requirements?",
          answer:
            "We build for them from the start: data handling, reporting, audit trails, and the documentation that examinations ask for. Compliance retrofitted later is the expensive version.",
        },
      ],
    },
    {
      kind: "cta-band",
      id: "cta-band",
      heading:
        "Growth and control are not opposites when the system is built right. Let us build yours right.",
      button: { label: "Talk to us about your platform", href: "/contact" },
    },
  ],
};
