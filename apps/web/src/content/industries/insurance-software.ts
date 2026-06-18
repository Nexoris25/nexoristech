/**
 * Insurance & InsurTech industry page, transcribed verbatim from the approved Website Copy
 * (Part 3).
 */
import type { MarketingPage } from "../types.js";

export const insuranceSoftware: MarketingPage = {
  meta: {
    slug: "/insurance-software",
    routeClass: "industry",
    title: "Insurance Software Solutions | Nexoris Technologies",
    description:
      "Policy administration, claims portals, and broker apps for insurers and HMOs. Settle claims faster, catch fraud earlier, and launch new products in just weeks.",
  },
  hero: {
    h1: "Settle claims in days and watch what it does for your renewals.",
    subline:
      "We build policy administration systems, claims portals, and broker apps for underwriters, brokers, and HMOs. Claims move in days instead of months, suspicious ones get flagged before they pay out, and new products launch in weeks rather than quarters.",
    primaryCta: { label: "Talk to us about your operation", href: "/contact" },
    secondaryCta: { label: "Find the right service", href: "#solution-finder" },
  },
  sections: [
    {
      kind: "cards",
      id: "pain",
      heading: "Every slow claim teaches a customer to leave at renewal.",
      cards: [
        {
          body: "The claim file moved between desks for six weeks. The customer told everyone they know.",
        },
        {
          body: "We suspect some claims are not genuine. Proving it is another matter.",
        },
        {
          body: "The product team has a great idea. The system needs eight months to support it.",
        },
        {
          body: "Our brokers sell from spreadsheets and call us for everything.",
        },
      ],
      closingLine:
        "Insurance is a promise, and the claim is where the promise gets kept or broken. Systems that keep it fast and honest are the whole competitive game.",
    },
    {
      kind: "cards",
      id: "solutions",
      heading: "What we build for insurers.",
      cards: [
        {
          title: "Policy administration systems.",
          body: "Quotes, issuance, endorsements, and renewals in one system that can actually move.",
        },
        {
          title: "Claims portals.",
          body: "Customers file with photos from their phones, adjusters work in a clear queue, and everyone sees the status.",
        },
        {
          title: "Agent and broker apps.",
          body: "Your distribution selling, quoting, and tracking commissions without calling head office.",
        },
        {
          title: "Self-service portals.",
          body: "Customers handle documents, payments, and simple changes themselves.",
        },
        {
          title: "Insurance APIs.",
          body: "Partners embedding your products into their platforms, which is distribution without branches.",
        },
        {
          title: "Premium finance tools.",
          body: "Flexible payment options handled cleanly, which grows the addressable market.",
        },
        {
          title: "Underwriting workbenches.",
          body: "Risk information assembled in front of the underwriter instead of hunted across systems.",
        },
      ],
    },
    {
      kind: "cards",
      id: "ai-where-it-helps",
      heading: "Where AI can cut your losses.",
      cards: [
        {
          title: "Claims triage.",
          body: "Simple, clean claims approved fast automatically, complex ones routed to the right adjuster with the file ready.",
        },
        {
          title: "Fraud flags before payout.",
          body: "The claim pattern that does not look right gets a closer look while the money is still yours.",
        },
        {
          title: "Risk scoring for underwriting.",
          body: "More data behind each decision, with the underwriter making the call.",
        },
        {
          title: "Damage estimates from photos.",
          body: "Uploaded pictures produce a first estimate in minutes, which moves the whole claim faster.",
        },
        {
          title: "Policy suggestions.",
          body: "Each customer offered the cover that fits their life, which sells better than a list.",
        },
        {
          title: "A quotes and claims chatbot.",
          body: "Status checks and quote questions answered instantly, at any hour.",
        },
      ],
      closingLine:
        "A human adjuster stays in the loop on anything significant. That is by design.",
    },
    {
      kind: "rich",
      id: "outcomes",
      heading: "What changes across the book.",
      body: [
        "Claims settle in days, and renewals quietly improve because of it. Loss ratios fall as fraud loses its cover. Distribution widens through brokers, partners, and self-service. And the next product launches in weeks, because the system stopped being the bottleneck.",
      ],
    },
    {
      kind: "dynamic",
      id: "services-links",
      heading: "Built with these services.",
      note: "Cards: AI Product Development, Business Process Automation, Chatbots & Virtual Assistants, Data Infrastructure & AI Readiness, Managed Technology Operations",
    },
    {
      kind: "rich",
      id: "proof",
      heading: "From insurers like yours.",
    },
    {
      kind: "dynamic",
      id: "proof-cards",
      note: "Case study cards from Strapi, filtered by industry tag, plus testimonial",
    },
    {
      kind: "faq",
      id: "faq",
      heading: "Asked by every underwriter we meet.",
      items: [
        {
          question: "Can it work alongside our legacy core?",
          answer:
            "Yes. We often build the customer, broker, and claims layers on top of an existing core, connected through its supported interfaces. Replacement, where needed, happens in stages, not as a cliff.",
        },
        {
          question: "How does automated claims approval stay safe?",
          answer:
            "Clear rules decide what qualifies for fast approval, everything else routes to a person, and every automated decision is logged and reviewable. Speed applies to the easy majority so your adjusters can focus on the rest.",
        },
        {
          question: "Will fraud detection accuse honest customers?",
          answer:
            "It flags for review rather than rejecting, and a person makes the call. The goal is a closer look at the unusual, never an automatic accusation.",
        },
        {
          question: "Can brokers and agents really work offline?",
          answer:
            "The apps are built for real field conditions: they work through poor coverage and sync when the connection returns.",
        },
        {
          question: "How quickly can we launch a new product on it?",
          answer:
            "Once the platform is in place, configuring a new product is weeks of work, not a rebuild. That speed is one of the main reasons insurers commission this.",
        },
      ],
    },
    {
      kind: "cta-band",
      id: "cta-band",
      heading:
        "Speed is retention in this business. Let us help you settle faster than anyone expects.",
      button: { label: "Talk to us about your operation", href: "/contact" },
    },
  ],
};
