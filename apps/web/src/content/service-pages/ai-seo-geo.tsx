/**
 * AI Content, SEO & GEO service page content, transcribed from the approved design handoff
 * (ai-seo-geo.html). The hero uses the interactive GEO platform-response widget. Copy, icons,
 * and FAQ match the design; the proof section states the "on our own site" position without
 * fabricated figures. Consumed by the ServiceView template.
 */
import type { ServiceContent } from "../../components/service/ServiceView.js";
import { GeoWidget } from "../../components/service/GeoWidget.js";

export const aiSeoGeo: ServiceContent = {
  breadcrumb: "AI Content, SEO & GEO",
  heroWidget: <GeoWidget />,
  hero: {
    kicker: "Grow it & keep it running · Get found",
    h1: "Your next client might not search Google at all. They will ask ChatGPT.",
    lede: "How people find businesses has changed faster than most companies realise. AI tools now answer the questions your buyers used to type into Google, and they only recommend businesses they have learned to trust. We build the content, the structure, and the signals that get you into those recommendations.",
    primaryCta: { label: "Request a discovery session", href: "/contact" },
    secondaryCta: { label: "See how it works", href: "#scope" },
    stats: [],
  },
  problem: {
    kicker: "Asked right now",
    h2: "Right now, AI tools are being asked about your industry. Do you know what they are saying?",
    quotes: [
      { text: "A customer told us ChatGPT recommended our competitor. By name." },
      { text: "Our rankings look fine but enquiries have been dropping for months." },
      { text: "We publish content every month and nothing seems to be gaining any ground." },
    ],
    close: (
      <>
        How people find and choose businesses has changed. Most marketing has not kept up.{" "}
        <b>That gap will not close on its own.</b>
      </>
    ),
  },
  scope: {
    kicker: "The work",
    h2: "What we actually do.",
    items: [
      {
        icon: (
          <>
            <rect x="4" y="3" width="11" height="15" rx="2" />
            <circle cx="14.5" cy="14.5" r="4" />
            <path d="M17.5 17.5L21 21" />
          </>
        ),
        title: "The audit",
        body: "We start by understanding where you actually stand. What you have published, what your competitors are getting cited for, what AI tools say when your industry comes up, and where the real gaps are.",
      },
      {
        icon: (
          <>
            <rect x="3" y="14" width="18" height="6" rx="1.4" />
            <rect x="6" y="8" width="12" height="6" rx="1.4" />
            <rect x="9" y="2" width="6" height="6" rx="1.4" />
          </>
        ),
        title: "Technical SEO and site structure",
        body: "Before content can perform, the foundations have to work. We fix how your site is crawled, indexed, structured, and how it communicates with search engines and AI tools.",
      },
      {
        icon: (
          <>
            <path d="M14 3v5h5" />
            <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7" />
            <path d="M19 14l3 3-4 4h-3v-3z" />
          </>
        ),
        title: "Content strategy and writing",
        body: "We build a plan around the questions your buyers are already asking, then write clear, well-researched articles every month, reviewed by a real person and published in your voice.",
      },
      {
        icon: (
          <>
            <path d="M21 11.5a8 8 0 0 1-11.6 7.1L4 20l1.4-5A8 8 0 1 1 21 11.5z" />
            <path d="M12 7.5l1 2.4 2.5.3-1.8 1.7.5 2.5-2.2-1.2-2.2 1.2.5-2.5-1.8-1.7 2.5-.3z" />
          </>
        ),
        title: "Generative Engine Optimisation",
        body: "The specific work of getting your content seen and cited by AI tools. ChatGPT, Perplexity, Google AI Overviews. The right structure, the right markup, the right framing.",
      },
      {
        icon: (
          <>
            <rect x="3" y="3" width="7" height="7" rx="1.4" />
            <rect x="14" y="3" width="7" height="7" rx="1.4" />
            <rect x="3" y="14" width="7" height="7" rx="1.4" />
            <rect x="14" y="14" width="7" height="7" rx="1.4" />
          </>
        ),
        title: "Your publishing system",
        body: "If your team needs a reliable way to get content live without waiting on a developer, we build that. WordPress, Strapi, Sanity, or a custom setup your team will actually keep using.",
      },
      {
        icon: <path d="M3 12h3l2 6 4-14 2.5 8H21" />,
        title: "Tracking and reporting",
        body: "We track where your business shows up across AI platforms and search every single month. You get a clear report: what moved, what we learned, what is next. Always in plain language.",
      },
    ],
  },
  ai: {
    kicker: "Our approach",
    h2: "We build things that last.",
    intro:
      "A lot of what gets called SEO is optimised for how things worked years ago. We focus on building genuine authority, because genuine authority does not expire. Technical improvements can show movement within weeks; content takes three to six months to build real momentum.",
    feats: [
      {
        icon: (
          <>
            <path d="M9 18h6M10 21h4" />
            <path d="M12 3a6 6 0 0 0-3.8 10.6c.7.6 1.1 1.5 1.3 2.4h5c.2-.9.6-1.8 1.3-2.4A6 6 0 0 0 12 3z" />
          </>
        ),
        title: "Expertise first",
        body: "We start from what your business genuinely knows. That is what earns citations. Keywords alone do not get you there.",
      },
      {
        icon: (
          <>
            <rect x="3" y="9" width="8" height="5.5" rx="1" />
            <rect x="13" y="9" width="8" height="5.5" rx="1" />
            <rect x="8" y="15" width="8" height="5.5" rx="1" />
            <path d="M3 5h18" />
          </>
        ),
        title: "Foundation before content",
        body: "Content built on a weak technical base does not travel as far as it should. We fix the foundation first. That is what makes everything else worth the investment.",
      },
      {
        icon: (
          <>
            <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
            <path d="M9 12l2 2 4-4.5" />
          </>
        ),
        title: "Built to last",
        body: "We are not running a campaign. We are building a body of work. The value grows over time. That is the whole point.",
      },
    ],
    foot: "Anyone promising page one rankings in thirty days is selling you something with an expiry date.",
  },
  process: {
    h2: "Our service delivery process.",
    stages: [
      {
        title: "Discovery & Foundation Setup",
        desc: "We establish the strategic and technical foundation for long-term search visibility. This includes understanding your business, audience, competitors, and current digital performance while identifying the highest-impact opportunities for growth.",
        activities: [
          "Business, audience, and competitor discovery",
          "Technical SEO audit",
          "AI search (GEO) readiness assessment",
          "Website performance and crawlability audit",
          "Keyword research and search intent analysis",
          "Content gap analysis",
          "Information architecture review",
          "Analytics and tracking verification",
          "Baseline performance benchmarking",
        ],
        deliverables: [
          "Comprehensive SEO & GEO Audit Report",
          "Technical Health Report",
          "AI Search Readiness Assessment",
          "Keyword Research & Topic Cluster Map",
          "Competitor Insights",
          "Baseline Performance Report",
          "Prioritized 90-Day Action Plan",
        ],
      },
      {
        title: "Strategy & Planning",
        desc: "Using insights gathered during the discovery phase, we develop a structured roadmap that aligns your content, website, and optimization efforts with your business objectives and customer journey.",
        activities: [
          "Content strategy development",
          "Editorial calendar planning",
          "Keyword clustering and topical mapping",
          "User search intent mapping",
          "Landing page planning",
          "Internal linking strategy",
          "Conversion pathway planning",
          "KPI and success metric definition",
        ],
        deliverables: [
          "SEO & GEO Strategy Document",
          "Content Calendar",
          "Keyword Cluster Plan",
          "Search Intent Framework",
          "Page Optimization Roadmap",
          "Conversion Strategy",
          "Performance KPI Framework",
        ],
      },
      {
        title: "Content Creation & Optimization",
        desc: "We execute the strategy by creating and optimizing content while continuously improving your website's on-page experience, technical performance, and AI search visibility.",
        activities: [
          "SEO & GEO content creation",
          "Existing content optimization",
          "On-page SEO implementation",
          "Metadata optimization",
          "Internal linking improvements",
          "Structured content optimization",
          "Technical SEO enhancements",
          "Content publishing or handover",
        ],
        deliverables: [
          "SEO-Optimized Content Assets",
          "Updated Website Pages",
          "On-Page SEO Improvements",
          "Technical Optimization Updates",
          "Internal Linking Enhancements",
          "Publication-Ready Content",
        ],
      },
      {
        title: "Performance Monitoring & Continuous Improvement",
        desc: "We monitor performance, measure outcomes, and refine the strategy using real-world data to drive continuous improvements in visibility, traffic, engagement, and conversions.",
        activities: [
          "Organic ranking monitoring",
          "AI search visibility tracking",
          "Traffic and engagement analysis",
          "Conversion performance review",
          "Technical health monitoring",
          "Content performance evaluation",
          "Strategy refinement",
          "Monthly optimization planning",
        ],
        deliverables: [
          "Monthly Performance Report",
          "Keyword Ranking Report",
          "AI Visibility Report",
          "Traffic & Conversion Analysis",
          "Strategic Recommendations",
          "Continuous Optimization Roadmap",
        ],
      },
    ],
    note: (
      <>
        Every engagement begins with a discovery session, and the order of these stages is what makes
        the work compound. <b>Foundation first, then strategy, content, and continuous improvement.</b>
      </>
    ),
  },
  proof: {
    kicker: "On ourselves first",
    h2: "We do this on our own site first.",
    lede: "If we cannot show it working on our own site, we have no business asking you to pay us to do it on yours.",
    cards: [
      {
        tag: "On our own site",
        title: "We track where Nexoris Technologies appears across ChatGPT, Gemini, Perplexity, and Google AI Overviews.",
      },
      {
        tag: "Structured for AI",
        title: "This website is built exactly the way we tell our clients to build theirs.",
      },
      {
        tag: "Published openly",
        title: "We publish our own visibility results here every quarter, as they come in.",
      },
    ],
  },
  industryLinks: {
    kicker: "Industries",
    h2: "Who we work with most.",
    lede: "Authority content and AI visibility matter most where buyers research carefully before they choose.",
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
        href: "/real-estate-software",
        icon: <path d="M3 21V8l9-5 9 5v13M9 21v-5h6v5M8 11h2M14 11h2" />,
        title: "Real Estate",
        body: "Listings, viewings, and tenant management in one portal.",
      },
      {
        href: "/hospitality-software",
        icon: <path d="M3 18V8M3 12h18v6M21 18v-3M7 12V9a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />,
        title: "Hospitality & Short-Lets",
        body: "Reservations, guests, and revenue handled across properties.",
      },
      {
        href: "/healthcare-software",
        icon: <path d="M3 12h4l2-6 4 12 2-6h6" />,
        title: "Healthcare & Clinics",
        body: "Records, scheduling, and patient care handled with care.",
      },
      {
        href: "/fitness-wellness-software",
        icon: <path d="M3 9v6M6 8v8M18 8v8M21 9v6M6 12h12" />,
        title: "Fitness, Beauty & Wellness",
        body: "Bookings, memberships, and clients managed in one place.",
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
    ],
  },
  faq: {
    kicker: "Questions",
    h2: "Things people ask before we get started.",
    lede: "The honest answers on timelines, GEO, AI-written content, and how we measure success.",
    items: [
      {
        q: "How long before we see results?",
        a: "Technical work can move things in a matter of weeks. Content usually takes three to six months to start building real momentum, and authority keeps growing beyond that. Anyone promising page one rankings in thirty days is selling you a short-term trick, not a long-term strategy.",
      },
      {
        q: "What is GEO?",
        a: "Generative Engine Optimisation. It is the work of making your content findable and citable by AI tools like ChatGPT, Perplexity, and Google AI Overviews. More and more of your buyers now get answers from these tools directly, without clicking a single search result.",
      },
      {
        q: "Will AI-written content hurt us?",
        a: "Poor quality content hurts you, regardless of how it was written. We use AI to help with research and first drafts. A person reviews and edits everything before it goes anywhere near your site. It leaves in your voice, with your knowledge behind it.",
      },
      {
        q: "Do we need to rebuild our website?",
        a: "Usually not. The foundation assessment tells us what your current platform can handle and whether anything needs to change before content work begins. We tell you that before you spend a naira on content.",
      },
      {
        q: "How do you measure whether it is working?",
        a: "Rankings, traffic, AI mentions, and most importantly, real enquiries. We track how often you appear in AI Overviews, how often your content gets cited for the topics that matter, and what it all produces in genuine commercial interest.",
      },
      {
        q: "What is the difference between your two ongoing packages?",
        a: "The first covers content production, search and visibility research, social distribution, and monthly reporting. The second adds long-form thought leadership, executive positioning, competitor monitoring, and quarterly strategy reviews.",
      },
    ],
  },
  cta: {
    h2: "Find out where you stand.",
    body: "In the discovery session, we look at where your business currently sits across Google and the major AI platforms, where the gaps are, and what it would take to close them. No commitment required on your end.",
    button: { label: "Request a discovery session", href: "/contact" },
  },
};
