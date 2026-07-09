/**
 * AI Product Development service page content, transcribed verbatim from the approved design
 * handoff (AI Product Development.html). Copy, stats, icons, and FAQ match the design exactly.
 * Industry links point to the existing industry routes. Consumed by the ServiceView template.
 */
import type { ServiceContent } from "../../components/service/ServiceView.js";
import { ProductBuilder } from "../../components/service/ProductBuilder.js";

export const aiProductDevelopment: ServiceContent = {
  breadcrumb: "AI Product Development",
  heroWidget: <ProductBuilder />,
  hero: {
    kicker: "Build new software · Our main service",
    h1: "We build the software your business has been working around.",
    lede: "Most software forces your team to change how they work. We do the opposite. We learn how your business runs, then design websites, web applications, mobile apps, and custom systems around it. If AI can make the product genuinely better, we build it in. If it cannot, we leave it out and tell you why.",
    primaryCta: { label: "Scope my product", href: "/contact" },
    secondaryCta: { label: "Find the right service", href: "/#finder" },
    stats: [],
  },
  problem: {
    kicker: "Heard in discovery",
    h2: "If any of this sounds like your week, keep reading.",
    quotes: [
      {
        text: "Our real system is a spreadsheet with seventeen tabs, and only one person understands it.",
        tag: "Heard in discovery",
      },
      {
        text: "We bought software that almost fits. The team uses half of it and keeps the rest in WhatsApp.",
        tag: "Heard in discovery",
      },
      {
        text: "We had a product idea, hired a developer, and then the developer disappeared with half the work.",
        tag: "Heard in discovery",
      },
    ],
    close: (
      <>
        None of this means your business is disorganised. It means nobody has built you the right
        system yet. <b>That is fixable, and fixing it is our main job.</b>
      </>
    ),
  },
  scope: {
    kicker: "What we do",
    h2: "What we design and build.",
    lede: "This is our main service and the starting point of most projects. Everything below is designed around your business first, then engineered properly.",
    items: [
      {
        icon: (
          <>
            <circle cx="12" cy="12" r="9" />
            <path d="M3 12h18M12 3c2.5 2.5 4 5.7 4 9s-1.5 6.5-4 9c-2.5-2.5-4-5.7-4-9s1.5-6.5 4-9z" />
          </>
        ),
        title: "Business websites and corporate platforms",
        body: "A site that explains what you do clearly, loads fast on real Nigerian connections, and brings in enquiries instead of just existing.",
      },
      {
        icon: (
          <>
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="M3 9h18M7 13h6M7 16h4" />
          </>
        ),
        title: "Web applications, SaaS products, and internal portals",
        body: "The tools your team or your customers log into every day, built to fit the job exactly.",
      },
      {
        icon: (
          <>
            <rect x="7" y="2" width="10" height="20" rx="2.5" />
            <path d="M11 18h2" />
          </>
        ),
        title: "iPhone and Android apps",
        body: "Your platform in your customers' and field staff's pockets, built natively or cross-platform depending on what the project actually needs.",
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
        title: "Custom business systems",
        body: "ERP, CRM, hospital records, school management, hotel management, and other systems shaped around how your operation really runs, not a generic workflow.",
      },
      {
        icon: (
          <>
            <path d="M12 19l7-7 3 3-7 7-3-3zM2 2l6 6M2 2l4 .8L6.8 8" />
            <path d="M15 5l4 4" />
          </>
        ),
        title: "UX research, interface design, and product architecture",
        body: "We design and test on screen before we build, because changing a design is cheap and changing built software is not.",
      },
      {
        icon: (
          <>
            <path d="M5 12.5a9 9 0 0 1 14 0M8 16a5 5 0 0 1 8 0" />
            <path d="M13 3l-3 8h4l-3 8" strokeLinejoin="round" />
          </>
        ),
        title: "Lightweight web apps for slow connections",
        body: "Progressive web apps that stay fast and usable even when the network is not.",
      },
    ],
  },
  ai: {
    kicker: "Where AI helps",
    h2: "AI features we can add, where they make sense.",
    intro:
      "Every brief gets looked at for where AI adds real value, and where it does not. These are the features that most often earn their place.",
    feats: [
      {
        icon: (
          <>
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </>
        ),
        title: "Natural search",
        body: "Your users ask in their own words and get the right answer, instead of guessing the exact filter.",
      },
      {
        icon: (
          <>
            <path d="M14 3v5h5" />
            <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M8 13h8M8 17h5" />
          </>
        ),
        title: "Drafting and summarising",
        body: "Long documents, reports, and messages get first drafts written for your team to approve.",
      },
      {
        icon: (
          <>
            <circle cx="12" cy="8" r="3.4" />
            <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
            <path d="M19 3l.7 1.8L21.5 5.5l-1.8.7L19 8l-.7-1.8L16.5 5.5l1.8-.7z" />
          </>
        ),
        title: "Personalisation",
        body: "The product adapts to how each person uses it, showing more of what they need and less of what they do not.",
      },
      {
        icon: (
          <>
            <path d="M3 17l6-6 4 4 8-8" />
            <path d="M21 7v5h-5" />
          </>
        ),
        title: "Predictions in workflows",
        body: "The system flags what is likely next, like a payment about to be missed or stock about to run out, while there is still time to act.",
      },
      {
        icon: (
          <>
            <rect x="9" y="3" width="6" height="11" rx="3" />
            <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
          </>
        ),
        title: "Voice and photo input",
        body: "Where typing is the bottleneck, like field reports or stock counts, speaking or snapping a photo does the job.",
      },
    ],
    foot: "If a feature will not earn its place, we will say so before you pay for it.",
  },
  process: {
    h2: "How a product project runs.",
    steps: [
      {
        title: "Discovery and Planning",
        body: "We learn how your business actually runs, then agree a clear scope, plan, and timeline before any code is written, so both sides know what is being built, by when, and for how much.",
      },
      {
        title: "UX and UI Design",
        body: "You see and approve the full designs before we write serious code. Changing a design costs little, while changing built software costs a lot.",
      },
      {
        title: "Development",
        body: "We build in visible stages and keep you updated throughout. If something shifts, you hear it from us first, with options.",
      },
      {
        title: "Quality Assurance",
        body: "We test across real browsers, devices, and Nigerian connections before any stage is marked complete. It has to work for your real users.",
      },
      {
        title: "Deployment and Handover",
        body: "We launch it, then hand over every source file, design, and document to your team. Nothing is held back.",
      },
      {
        title: "Ongoing Support",
        body: "Maintenance plans that cover updates, monitoring, and steady improvement, because software nobody maintains slowly becomes a problem.",
      },
    ],
    note: (
      <>
        We follow our six stages on every build. The part clients value most comes early:{" "}
        <b>you see and approve the actual designs before serious development begins</b>, so the
        product you imagined is the product that gets built. At the end, all code and designs are
        handed over to you completely.
      </>
    ),
  },
  proof: {
    kicker: "Proof",
    h2: "What this has looked like for others.",
    lede: "Every build below started with a business problem, not a feature list.",
    cards: [
      { tag: "Case study", title: "Custom system replacing the seventeen-tab spreadsheet." },
      { tag: "Case study", title: "A web app the whole team logs into instead of WhatsApp." },
      { tag: "In-house build", title: "A product idea taken from sketch to launched app." },
    ],
  },
  industryLinks: {
    kicker: "Industries",
    h2: "Where we build this most often.",
    lede: "Custom software is our main service across all twenty industries we serve. These are the pages most visitors here want next.",
    links: [
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
        href: "/real-estate-software",
        icon: <path d="M3 21V8l9-5 9 5v13M9 21v-5h6v5M8 11h2M14 11h2" />,
        title: "Real Estate",
        body: "Listings, viewings, and tenant management in one portal.",
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
    ],
  },
  faq: {
    kicker: "Questions",
    h2: "Asked before nearly every product project.",
    lede: "Straight answers to the things clients raise before we start. If yours is not here, ask us directly.",
    items: [
      {
        q: "How long does it take to build custom software?",
        a: "A business website usually takes four to eight weeks. A custom system or app typically runs three to six months, delivered in stages so you see working software early, not just at the end. Your written scope carries the real dates.",
      },
      {
        q: "Custom software sounds expensive. Is it?",
        a: "It costs more upfront than off-the-shelf tools and less over time than working around tools that do not fit. We will tell you honestly when an off-the-shelf product is the better answer, because sometimes it is.",
      },
      {
        q: "Can you take over a project another developer started?",
        a: "Yes, after an honest technical review of what exists. Sometimes we continue it, sometimes we recommend rebuilding parts, and we explain why in plain words either way.",
      },
      {
        q: "Do we have to include AI features?",
        a: "No. AI goes in only where it makes the product genuinely better. Plenty of excellent software needs none, and we will tell you if yours is one of them.",
      },
      {
        q: "What happens after launch?",
        a: "You own everything, and your team can run it independently. Most clients also take a managed plan so we keep monitoring, updating, and improving the product. Either way, the choice is yours.",
      },
    ],
  },
  cta: {
    h2: "You have worked around the wrong software long enough.",
    body: "Let us design the right one. Tell us what you are trying to achieve, and we will reply within one business day with a short call, a suggested approach, and a realistic sense of timeline and cost.",
    button: { label: "Scope my product", href: "/contact" },
    media: {
      src: "/services/ai-product-development-cta.webp",
      alt: "A product designer pinning interface wireframes on a planning wall",
    },
  },
};
