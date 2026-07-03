/**
 * Data Dashboards & Predictive Analytics service page, transcribed from the approved design handoff
 * (data-dashboards-predictive-analytics.html). The hero uses the interactive dashboard widget.
 * Copy, icons, and FAQ match the handoff; proof states honest "one screen" outcomes without
 * fabricated figures. Consumed by the ServiceView template.
 */
import type { ServiceContent } from "../../components/service/ServiceView.js";
import { DashboardWidget } from "../../components/service/DashboardWidget.js";

export const dataDashboardsPredictiveAnalytics: ServiceContent = {
  breadcrumb: "Data Dashboards & Analytics",
  heroWidget: <DashboardWidget />,
  hero: {
    kicker: "Understand your numbers",
    h1: "See how your business is really doing, the moment you ask.",
    lede: "We design every dashboard around the decisions it has to support, not around whatever data happens to be lying around. Leadership gets a live view of the business, and forecasts built on your own history show what is coming early enough to act.",
    primaryCta: { label: "Design my dashboard", href: "/contact" },
    secondaryCta: { label: "Find the right service", href: "/#finder" },
    stats: [],
  },
  problem: {
    kicker: "The problem",
    h2: "You are making this quarter's decisions with last quarter's numbers.",
    quotes: [
      {
        text: "By the time the report reaches me, the numbers in it have already changed.",
        tag: "Arriving too late",
      },
      {
        text: "Sales says one figure, finance says another, and the meeting becomes an argument about whose spreadsheet is right.",
        tag: "Disagreeing with itself",
      },
      {
        text: "We priced it on gut feel. The data would have told us, if anyone could have found it in time.",
        tag: "Decided blind",
      },
    ],
    close: (
      <>
        The information already exists inside your business. It is just arriving too late and
        disagreeing with itself. <b>Both problems are fixable.</b>
      </>
    ),
  },
  scope: {
    kicker: "What we build",
    h2: "What we build.",
    items: [
      {
        icon: (
          <>
            <path d="M3 3v18h18" />
            <path d="M7 15l3-4 3 2 4-6" />
          </>
        ),
        title: "Dashboards for executives and operations teams",
        body: "Each one designed around the decisions that person actually makes, so the first screen answers the first question.",
      },
      {
        icon: (
          <>
            <path d="M21 12a9 9 0 1 1-3-6.7" />
            <path d="M21 4v4h-4" />
            <path d="M12 8v4l3 2" />
          </>
        ),
        title: "KPI tracking with automatic reporting",
        body: "Daily, weekly, and monthly reports that build and send themselves, on time, every time.",
      },
      {
        icon: (
          <>
            <path d="M4 18l5-6 3 3 7-9" />
            <path d="M21 6v5h-5" />
          </>
        ),
        title: "Forecasts for sales, cash flow, and demand",
        body: "Built on your own history, so you see next month early enough to do something about it.",
      },
      {
        icon: (
          <>
            <rect x="3" y="4" width="18" height="14" rx="2" />
            <path d="M3 9h18M8 21h8" />
          </>
        ),
        title: "Board and investor reporting",
        body: "The numbers that matter, presented clearly enough that the meeting is about decisions, not definitions.",
      },
      {
        icon: (
          <>
            <path d="M12 3a7 7 0 0 0-7 7c0 3 2 4 2 7h10c0-3 2-4 2-7a7 7 0 0 0-7-7z" />
            <path d="M9 21h6" />
          </>
        ),
        title: "Alerts on the numbers you care about",
        body: "When a figure crosses a line you set, the right person hears about it immediately.",
      },
    ],
  },
  ai: {
    kicker: "From reporting to seeing ahead",
    h2: "From reporting to seeing ahead.",
    intro:
      "A dashboard tells you what already happened. These features tell you what is about to, so you can act while there is still time.",
    feats: [
      {
        icon: (
          <>
            <path d="M4 18l5-6 3 3 7-9" />
            <path d="M21 6v5h-5" />
          </>
        ),
        title: "Forecasts you can trust",
        body: "Your own history, projected forward honestly, with the uncertainty shown rather than hidden.",
      },
      {
        icon: (
          <>
            <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="3.4" />
            <path d="M19 8v6M22 11h-6" />
          </>
        ),
        title: "Early warning on churn",
        body: "The quiet drop in activity gets noticed while there is still time to act on it.",
      },
      {
        icon: (
          <>
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </>
        ),
        title: "Questions in plain language",
        body: "Ask how Abuja did last month against target and get the answer, without waiting for an analyst.",
      },
      {
        icon: <path d="M4 7h16M4 12h16M4 17h10" />,
        title: "Summaries written for you",
        body: "The numbers arrive with a short explanation of what moved and why it matters.",
      },
      {
        icon: (
          <>
            <path d="M12 3v6l4 2" />
            <circle cx="12" cy="13" r="8" />
          </>
        ),
        title: "What-if planning",
        body: "Test a price change or a new branch on the model before you test it on the business.",
      },
    ],
    foot: "We add the forecasting your decisions actually need, and nothing you will not use.",
  },
  process: {
    h2: "We start with your decisions, not your data.",
    steps: [
      {
        title: "Name the decisions",
        body: "What do you decide weekly, monthly, quarterly, and what would you need to see to decide it well?",
      },
      {
        title: "Trace to the data",
        body: "We connect those needs back to your real data sources and design screens people check every morning.",
      },
      {
        title: "Build what gets used",
        body: "A dashboard that answers a real Monday-morning question gets opened every Monday morning.",
      },
    ],
    note: (
      <>
        If your data is not ready to support this, we will tell you plainly, because{" "}
        <b>a dashboard built on numbers nobody trusts just makes arguments faster.</b> When that
        happens, the right first step is our{" "}
        <a href="/data-infrastructure-ai-readiness/">data readiness service</a>.
      </>
    ),
  },
  proof: {
    kicker: "What leadership sees after we ship",
    h2: "One screen instead of four spreadsheets.",
    lede: "Nothing here is a magic number. It is simply what changes once leadership shares one screen instead of four spreadsheets.",
    cards: [
      {
        tag: "One agreed view",
        title: "Numbers the whole leadership team agrees on, because they come from one source.",
      },
      {
        tag: "Warnings early",
        title: "The stock that will run out, the customer going quiet, the cash dip two months ahead.",
      },
      { tag: "Time to act", title: "Each warning lands while there is still room to do something about it." },
    ],
  },
  industryLinks: {
    kicker: "Industries",
    h2: "Where dashboards change the conversation.",
    lede: "Dashboards change the conversation wherever the numbers are late, scattered, or argued over.",
    links: [
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
        href: "/media-entertainment-software",
        icon: (
          <>
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="M10 9l5 3-5 3z" />
          </>
        ),
        title: "Media & Entertainment",
        body: "Content, streaming, and subscriptions with the money handled.",
      },
    ],
  },
  faq: {
    kicker: "Questions",
    h2: "Asked by every decision maker we meet.",
    lede: "Messy data, forecast accuracy, connecting your tools, and whether your team will actually use it.",
    items: [
      {
        q: "Our data is a mess. Can you still build this?",
        a: "We will tell you honestly after looking. Sometimes light cleaning along the way is enough. When it is not, the right first step is our data readiness service, because a dashboard cannot fix numbers nobody trusts, and we will not pretend otherwise.",
      },
      {
        q: "How accurate are the forecasts?",
        a: "As accurate as your history allows, and we show the uncertainty rather than hiding it. A forecast that says between 80 and 95 honestly beats one that says 92 confidently and wrongly.",
      },
      {
        q: "Can it pull from the tools we already use?",
        a: "Yes. Accounting, sales, payment, and operations tools connect into one view. Connecting what you already have is most of the job.",
      },
      {
        q: "Will our team actually use it?",
        a: "That is a design question, and it is why we start from decisions rather than data. A dashboard that answers a real Monday-morning question gets opened every Monday morning.",
      },
      {
        q: "What does it cost to run after launch?",
        a: "A managed plan keeps the connections healthy, the forecasts tuned, and the reports flowing. Most clients take one, and the monthly cost is a fraction of one wrong decision made blind.",
      },
    ],
  },
  cta: {
    h2: "Stop waiting for the report. Open the page and know.",
    body: "Tell us the decisions you make every week. We will reply within one business day with the dashboard we would design around them.",
    button: { label: "Design my dashboard", href: "/contact" },
  },
};
