/**
 * AI Product Development service page, transcribed verbatim from the approved Website Copy
 * (Part 2). Pain-point quotes are stored without their surrounding quotation marks; the quote
 * styling is presentational. Cross-link card lists are dynamic (Strapi), so they are notes.
 */
import type { MarketingPage } from "../types.js";

export const aiProductDevelopment: MarketingPage = {
  meta: {
    slug: "/ai-product-development",
    routeClass: "service",
    title: "Custom Software & App Development | Nexoris Technologies",
    description:
      "We design and build websites, web apps, mobile apps, and custom systems around how your team works, not the other way round. Built in Lagos, used everywhere.",
  },
  hero: {
    h1: "We build the software your business has been working around.",
    subline:
      "Most software forces your team to change how they work. We do the opposite. We learn how your business runs, then design websites, web applications, mobile apps, and custom systems around it. If AI can make the product genuinely better, we build it in. If it cannot, we leave it out and tell you why.",
    primaryCta: { label: "Scope my product", href: "/contact" },
    secondaryCta: { label: "Find the right service", href: "#solution-finder" },
  },
  sections: [
    {
      kind: "cards",
      id: "pain",
      heading: "If any of this sounds like your week, keep reading.",
      cards: [
        {
          body: "Our real system is a spreadsheet with seventeen tabs, and only one person understands it.",
        },
        {
          body: "We bought software that almost fits. The team uses half of it and keeps the rest in WhatsApp.",
        },
        {
          body: "We had a product idea, hired a developer, and then the developer disappeared with half the work.",
        },
      ],
      closingLine:
        "None of this means your business is disorganised. It means nobody has built you the right system yet. That is fixable, and fixing it is our main job.",
    },
    {
      kind: "cards",
      id: "scope",
      heading: "What we design and build.",
      intro:
        "This is our main service and the starting point of most projects. Everything below is designed around your business first, then engineered properly.",
      cards: [
        {
          title: "Business websites and corporate platforms.",
          body: "A site that explains what you do clearly, loads fast on real Nigerian connections, and brings in enquiries instead of just existing.",
        },
        {
          title: "Web applications, SaaS products, and internal portals.",
          body: "The tools your team or your customers log into every day, built to fit the job exactly.",
        },
        {
          title: "iPhone and Android apps.",
          body: "Your platform in your customers' and field staff's pockets, built natively or cross-platform depending on what the project actually needs.",
        },
        {
          title: "Custom business systems.",
          body: "ERP, CRM, hospital records, school management, hotel management, and other systems shaped around how your operation really runs, not a generic workflow.",
        },
        {
          title: "UX research, interface design, and product architecture.",
          body: "We design and test on screen before we build, because changing a design is cheap and changing built software is not.",
        },
        {
          title: "Lightweight web apps for slow connections.",
          body: "Progressive web apps that stay fast and usable even when the network is not.",
        },
      ],
    },
    {
      kind: "cards",
      id: "ai-where-it-helps",
      heading: "AI features we can add, where they make sense.",
      intro:
        "Every brief gets looked at for where AI adds real value, and where it does not. These are the features that most often earn their place.",
      cards: [
        {
          title: "Search people can type into naturally.",
          body: "Your users ask in their own words and get the right answer, instead of guessing the exact filter.",
        },
        {
          title: "Drafting and summarising.",
          body: "Long documents, reports, and messages get first drafts written for your team to approve.",
        },
        {
          title: "Personalisation.",
          body: "The product adapts to how each person uses it, showing them more of what they need and less of what they do not.",
        },
        {
          title: "Predictions inside everyday workflows.",
          body: "The system flags what is likely to happen next, like a payment about to be missed or stock about to run out, while there is still time to act.",
        },
        {
          title: "Voice and photo input.",
          body: "Where typing is the bottleneck, like field reports or stock counts, speaking or snapping a photo does the job.",
        },
      ],
      closingLine:
        "If a feature will not earn its place, we will say so before you pay for it.",
    },
    {
      kind: "rich",
      id: "process",
      heading: "How a product project runs.",
      body: [
        "We follow our six stages on every build: Discovery and Planning, UX/UI Design, Development, Quality Assurance and Testing, Deployment and Handover, then Ongoing Support. The part clients value most comes early: you see and approve the actual designs before serious development begins, so the product you imagined is the product that gets built. At the end, all code and designs are handed over to you completely.",
      ],
      link: { label: "See the full approach", href: "/how-we-work" },
    },
    {
      kind: "rich",
      id: "proof",
      heading: "What this has looked like for others.",
      intro:
        "Every build below started with a business problem, not a feature list.",
    },
    {
      kind: "dynamic",
      id: "proof-cards",
      note: "Case study cards from Strapi, filtered by service tag, including the in-house builds from the Case Studies page",
    },
    {
      kind: "dynamic",
      id: "industries-links",
      heading: "Where we build this most often.",
      intro:
        "Custom software is our main service across all twenty industries we serve. These are the pages most visitors here want next.",
      note: "Cards: Fintech, Healthcare, Education, Retail, Logistics",
    },
    {
      kind: "faq",
      id: "faq",
      heading: "Asked before nearly every product project.",
      items: [
        {
          question: "How long does it take to build custom software?",
          answer:
            "A business website usually takes four to eight weeks. A custom system or app typically runs three to six months, delivered in stages so you see working software early, not just at the end. Your written scope carries the real dates.",
        },
        {
          question: "Custom software sounds expensive. Is it?",
          answer:
            "It costs more upfront than off-the-shelf tools and less over time than working around tools that do not fit. We will tell you honestly when an off-the-shelf product is the better answer, because sometimes it is.",
        },
        {
          question: "Can you take over a project another developer started?",
          answer:
            "Yes, after an honest technical review of what exists. Sometimes we continue it, sometimes we recommend rebuilding parts, and we explain why in plain words either way.",
        },
        {
          question: "Do we have to include AI features?",
          answer:
            "No. AI goes in only where it makes the product genuinely better. Plenty of excellent software needs none, and we will tell you if yours is one of them.",
        },
        {
          question: "What happens after launch?",
          answer:
            "You own everything, and your team can run it independently. Most clients also take a managed plan so we keep monitoring, updating, and improving the product. Either way, the choice is yours.",
        },
      ],
    },
    {
      kind: "cta-band",
      id: "cta-band",
      heading:
        "You have worked around the wrong software long enough. Let us design the right one.",
      button: { label: "Scope my product", href: "/contact" },
    },
  ],
};
