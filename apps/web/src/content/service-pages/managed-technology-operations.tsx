/**
 * Managed Technology Operations service page, transcribed from the approved design handoff
 * (managed-technology-operations.html). The hero uses the interactive live ops-console widget. Copy,
 * icons, and FAQ match the handoff; the "Three levels of cover" plans are transcribed into the dark
 * service-levels band (the AI section), and proof states honest "why they stay" outcomes without
 * fabricated figures. Consumed by the ServiceView template.
 */
import type { ServiceContent } from "../../components/service/ServiceView.js";
import { OpsConsole } from "../../components/service/OpsConsole.js";

export const managedTechnologyOperations: ServiceContent = {
  breadcrumb: "Managed Technology Operations",
  heroWidget: <OpsConsole />,
  hero: {
    kicker: "Keep it running · After launch",
    h1: "We stay after launch, because that is when your software starts earning.",
    lede: "Most of our clients stay with us on a monthly plan after delivery. We monitor, update, support, and improve the platform in regular cycles, so the product you invested in keeps getting better instead of slowly going stale.",
    primaryCta: { label: "Start a managed plan", href: "/contact" },
    secondaryCta: { label: "Find the right service", href: "/#finder" },
    stats: [],
  },
  problem: {
    kicker: "Quietly decaying",
    h2: "Software nobody maintains is quietly becoming a problem.",
    quotes: [
      {
        text: "There was a security update. Nobody applied it. We found out the hard way.",
        tag: "Unpatched risk",
      },
      { text: "The system got slower and slower, and everyone just got used to it.", tag: "Slow decay" },
      {
        text: "The developer who built it moved on. Now nobody is quite sure how it works.",
        tag: "Lost knowledge",
      },
    ],
    close: (
      <>
        Software does not stay still. It either gets maintained or it gets worse, and{" "}
        <b>the second option always costs more in the end.</b>
      </>
    ),
  },
  scope: {
    kicker: "What we do",
    h2: "What the plan covers.",
    items: [
      {
        icon: <path d="M3 12h4l2 6 4-12 2 6h6" />,
        title: "Round-the-clock monitoring",
        body: "We watch uptime, performance, and errors continuously, and usually know about problems before your users do.",
      },
      {
        icon: (
          <>
            <path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z" />
            <path d="M9 12l2 2 4-4" />
          </>
        ),
        title: "Security patches applied on time",
        body: "The updates that protect you happen on schedule, not whenever someone remembers.",
      },
      {
        icon: (
          <>
            <path d="M21 12a9 9 0 1 1-3-6.7" />
            <path d="M21 4v4h-4" />
            <path d="M9 12l2 2 4-4" />
          </>
        ),
        title: "Updates and speed improvements",
        body: "The platform stays current and fast as it grows, instead of slowly thickening.",
      },
      {
        icon: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
        title: "Support when something breaks",
        body: "A real route to a real person, with response times that match your plan.",
      },
      {
        icon: (
          <>
            <path d="M9 3H4v5M15 3h5v5M9 21H4v-5M15 21h5v-5" />
            <circle cx="12" cy="12" r="3" />
          </>
        ),
        title: "A quarterly review and improvement plan",
        body: "Every three months we look at the data, agree the improvements worth making, and ship them.",
      },
      {
        icon: <path d="M12 1v22M5 5h11a3 3 0 0 1 0 6H7a3 3 0 0 0 0 6h12" />,
        title: "A sensible cloud bill",
        body: "We watch your hosting costs and capacity, and trim what you are paying for but not using.",
      },
    ],
  },
  ai: {
    kicker: "Service levels",
    h2: "Three levels of cover.",
    intro:
      "Pick the level that matches the stakes. You can change it later, monthly, as the platform grows. Every plan includes a clear monthly report a non-technical owner can read in five minutes.",
    feats: [
      {
        icon: (
          <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v4l3 2" />
          </>
        ),
        title: "Standard · 99.5% uptime",
        body: "Business-hours support. Right for internal tools and platforms where an evening issue can wait for morning.",
      },
      {
        icon: (
          <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v4l3 2" />
          </>
        ),
        title: "Priority · 99.9% uptime · most chosen",
        body: "Extended-hours support. Right for customer-facing platforms where downtime costs sales and trust.",
      },
      {
        icon: (
          <>
            <circle cx="9" cy="8" r="3.4" />
            <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
            <path d="M16 8h5M18.5 5.5v5" />
          </>
        ),
        title: "Enterprise · 24/7",
        body: "A dedicated account team and an on-site engineer option for large accounts. Right for platforms the business genuinely cannot operate without.",
      },
    ],
    foot: "All plans include a clear monthly report with practical recommendations, written so a non-technical owner can read it in five minutes.",
  },
  process: {
    h2: "How the plan works month to month.",
    steps: [
      {
        title: "Monitoring in the background",
        body: "Issues get caught, triaged, and fixed according to your plan's response times, usually before anyone notices.",
      },
      {
        title: "A plain-language report",
        body: "What happened, what we fixed, and what we recommend, written so a non-technical owner can read it in five minutes.",
      },
      {
        title: "A round of improvements",
        body: "The platform is measurably better every three months than it was the three months before.",
      },
    ],
    note: (
      <>
        The rhythm is the point: monitoring always on, a plain-language report every month, and a
        round of improvements every quarter.{" "}
        <b>Measurably better every three months than it was the three before.</b>
      </>
    ),
  },
  proof: {
    kicker: "Why they stay",
    h2: "Why clients stay on these plans for years.",
    lede: "Nothing here is a magic number. It is simply what a maintained platform stops making you worry about.",
    cards: [
      { tag: "Why they stay", title: "Uptime becomes something you stop thinking about." },
      {
        tag: "Why they stay",
        title: "Hosting costs trend down because someone is actually watching them.",
      },
      {
        tag: "Why they stay",
        title: "The platform keeps improving quarter after quarter, an asset instead of a depreciating expense.",
      },
    ],
  },
  industryLinks: {
    kicker: "Who relies on this",
    h2: "Who relies on managed operations.",
    lede: "Every platform we build can move onto a plan at launch, and most do. We also take on systems built by other teams, after an honest technical review.",
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
    h2: "Asked before every plan.",
    lede: "The honest answers about other teams' code, emergencies, and what a plan costs.",
    items: [
      {
        q: "Do you maintain software that other teams built?",
        a: "Yes, after an honest technical review. We tell you what shape the system is really in, what it needs, and what the plan will cover, before either side commits.",
      },
      {
        q: "What counts as an emergency, and how fast do you respond?",
        a: "Each plan defines it in writing: what severity levels mean, how fast we respond to each, and through which channels. You will know exactly what you are buying, with no vague promises.",
      },
      {
        q: "Can we change plans later?",
        a: "Yes, monthly. Businesses grow, and a platform that was internal last year is customer-facing this year. The plan should follow the stakes.",
      },
      {
        q: "Is this just for emergencies, or does the product actually improve?",
        a: "It improves, on a schedule. The quarterly improvement cycle is the heart of the plan: small, steady upgrades that compound, which is exactly how good software stays good.",
      },
      {
        q: "What does a plan cost?",
        a: "It scales with the platform's size and the cover level, and it is a predictable monthly figure agreed in writing. Set it against the cost of one serious outage or one missed security patch, and the comparison usually ends the conversation.",
      },
    ],
  },
  cta: {
    h2: "The launch was the beginning. Protect what you built and let it keep improving.",
    body: "Tell us what you are running, whether we built it or someone else did. We will reply within one business day with the right level of cover.",
    button: { label: "Compare service plans", href: "/contact" },
  },
};
