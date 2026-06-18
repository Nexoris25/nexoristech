/**
 * NGOs, Non-Profits & Development Organisations industry page, transcribed verbatim from
 * the approved Website Copy (Part 3).
 */
import type { MarketingPage } from "../types.js";

export const ngoSoftware: MarketingPage = {
  meta: {
    slug: "/ngo-software",
    routeClass: "industry",
    title: "NGO & M&E Software | Nexoris Technologies",
    description:
      "Monitoring and evaluation platforms, offline field data apps, and impact dashboards for NGOs. Donor reports that mostly build themselves, and stay audit-ready.",
  },
  hero: {
    h1: "Show funders exactly what their money achieved, with the records to back it.",
    subline:
      "We build monitoring and evaluation platforms, field data apps that work offline, and impact dashboards for NGOs and development organisations. Field data arrives clean, donor reports mostly assemble themselves, and your next funding application carries evidence instead of estimates.",
    primaryCta: { label: "Talk to us about your programmes", href: "/contact" },
    secondaryCta: { label: "Find the right service", href: "#solution-finder" },
  },
  sections: [
    {
      kind: "cards",
      id: "pain",
      heading: "The work is real. Proving it should not take half your team.",
      cards: [
        {
          body: "The quarterly donor report takes three weeks of the team's time. Every quarter.",
        },
        {
          body: "The same beneficiary appears in two programmes under two spellings, and the count is wrong both times.",
        },
        {
          body: "Field data arrives late, on paper, and some of it does not survive the journey.",
        },
        {
          body: "Programme says one number, finance says another, and M&E is the referee.",
        },
      ],
      closingLine:
        "Funders do not just buy outcomes. They buy confidence in your numbers. The systems below manufacture that confidence as a by-product of doing the work.",
    },
    {
      kind: "cards",
      id: "solutions",
      heading: "What we build for the sector.",
      cards: [
        {
          title: "Monitoring and evaluation platforms.",
          body: "Indicators, targets, and results tracked properly across every programme.",
        },
        {
          title: "Donor management.",
          body: "Grants, requirements, and deadlines organised, so compliance is a calendar rather than a scramble.",
        },
        {
          title: "Mobile data collection that works offline.",
          body: "Field teams capture data anywhere, and it syncs clean when the network returns.",
        },
        {
          title: "Beneficiary registration.",
          body: "One person, one record, across programmes, with duplicates caught at the door.",
        },
        {
          title: "Impact dashboards.",
          body: "Results visible live, to leadership and, where you choose, to funders.",
        },
        {
          title: "Grant reporting tools.",
          body: "Reports drawn from live data in the formats each donor demands.",
        },
        {
          title: "Volunteer management.",
          body: "The people who give their time, organised with the respect that deserves.",
        },
      ],
    },
    {
      kind: "cards",
      id: "ai-where-it-helps",
      heading: "Where AI can strengthen your accountability.",
      cards: [
        {
          title: "Donor reports drafted automatically.",
          body: "The numbers and narrative assembled from your real data, for your team to review and send.",
        },
        {
          title: "Unusual field data flagged.",
          body: "The entry that does not fit the pattern gets a question before it reaches a report.",
        },
        {
          title: "Beneficiary chatbots in local languages.",
          body: "Programme information and feedback channels open to the people you serve, in their own words.",
        },
        {
          title: "Photo-based verification.",
          body: "Evidence that the borehole, the kit, or the training actually happened, attached to the record.",
        },
        {
          title: "Programme impact forecasts.",
          body: "What the data says you are on track to achieve, early enough to adjust.",
        },
      ],
      closingLine:
        "Your M&E team approves everything. The AI just removes the drudgery.",
    },
    {
      kind: "rich",
      id: "outcomes",
      heading: "What changes by the next reporting cycle.",
      body: [
        "Grant renewals strengthen because the evidence is clean and ready. Programmes get steered by real data mid-cycle instead of judged by it afterwards. Audits find records instead of gaps, and funders extend the kind of trust that turns one grant into a relationship.",
      ],
    },
    {
      kind: "dynamic",
      id: "services-links",
      heading: "Built with these services.",
      note: "Cards: AI Product Development, Dashboards & Analytics, Business Process Automation, Data Infrastructure & AI Readiness, Managed Technology Operations",
    },
    {
      kind: "rich",
      id: "proof",
      heading: "From organisations like yours.",
    },
    {
      kind: "dynamic",
      id: "proof-cards",
      note: "Case study cards from Strapi, filtered by industry tag, plus testimonial",
    },
    {
      kind: "faq",
      id: "faq",
      heading: "Asked by every programme director we meet.",
      items: [
        {
          question: "Does the field data collection really work offline?",
          answer:
            "Yes, fully. Enumerators capture data with no signal at all, and it syncs with validation when coverage returns. Rural programme areas are the design assumption, not the edge case.",
        },
        {
          question: "Can it produce reports in different donor formats?",
          answer:
            "Yes. Each donor's indicators and templates are configured once, and reports draw from the same underlying data, so one set of truth serves every funder.",
        },
        {
          question: "How do you protect beneficiary data?",
          answer:
            "Strictly: encryption, role-based access, consent recorded, and NDPR-aligned handling. Beneficiary data is among the most sensitive there is, and the system treats it accordingly.",
        },
        {
          question:
            "Can it work alongside donor-mandated systems we already use?",
          answer:
            "Usually yes. We integrate or exchange data with the platforms your funders require, so your team stops doing double entry between them.",
        },
        {
          question: "We are a small organisation. Is this within reach?",
          answer:
            "The system scales to the organisation, and small teams often gain the most, because the reporting burden falls on the fewest shoulders. The first conversation will give you an honest answer about fit and cost.",
        },
      ],
    },
    {
      kind: "cta-band",
      id: "cta-band",
      heading:
        "Funders back the organisations that can show their work. Let us help you show yours properly.",
      button: { label: "Talk to us about your programmes", href: "/contact" },
    },
  ],
};
