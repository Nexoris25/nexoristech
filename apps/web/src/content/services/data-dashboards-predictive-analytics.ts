/**
 * Data Dashboards & Predictive Analytics service page, transcribed verbatim from the
 * approved Website Copy (Part 2).
 */
import type { MarketingPage } from "../types.js";

export const dataDashboardsPredictiveAnalytics: MarketingPage = {
  meta: {
    slug: "/data-dashboards-predictive-analytics",
    routeClass: "service",
    title: "Business Dashboards & Analytics | Nexoris Technologies",
    description:
      "Live dashboards and forecasts built around the decisions you actually make. Know today's numbers and see next quarter coming well before your competitors do.",
  },
  hero: {
    h1: "See how your business is really doing, the moment you ask.",
    subline:
      "We design every dashboard around the decisions it has to support, not around whatever data happens to be lying around. Leadership gets a live view of the business, and forecasts built on your own history show what is coming early enough to act.",
    primaryCta: { label: "Design my dashboard", href: "/contact" },
    secondaryCta: { label: "Find the right service", href: "#solution-finder" },
  },
  sections: [
    {
      kind: "cards",
      id: "pain",
      heading:
        "You are making this quarter's decisions with last quarter's numbers.",
      cards: [
        {
          body: "By the time the report reaches me, the numbers in it have already changed.",
        },
        {
          body: "Sales says one figure, finance says another, and the meeting becomes an argument about whose spreadsheet is right.",
        },
        {
          body: "We priced it on gut feel. The data would have told us, if anyone could have found it in time.",
        },
      ],
      closingLine:
        "The information already exists inside your business. It is just arriving too late and disagreeing with itself. Both problems are fixable.",
    },
    {
      kind: "cards",
      id: "scope",
      heading: "What we build.",
      cards: [
        {
          title: "Dashboards for executives and operations teams.",
          body: "Each one designed around the decisions that person actually makes, so the first screen answers the first question.",
        },
        {
          title: "KPI tracking with automatic reporting.",
          body: "Daily, weekly, and monthly reports that build and send themselves, on time, every time.",
        },
        {
          title: "Forecasts for sales, cash flow, and demand.",
          body: "Built on your own history, so you see next month early enough to do something about it.",
        },
        {
          title: "Board and investor reporting.",
          body: "The numbers that matter, presented clearly enough that the meeting is about decisions, not definitions.",
        },
        {
          title: "Alerts on the numbers you care about.",
          body: "When a figure crosses a line you set, the right person hears about it immediately.",
        },
      ],
    },
    {
      kind: "cards",
      id: "ai-where-it-helps",
      heading: "From reporting to seeing ahead.",
      cards: [
        {
          title: "Forecasts for sales, stock, and demand.",
          body: "Your own history, projected forward honestly, with the uncertainty shown rather than hidden.",
        },
        {
          title: "Early warning on customers likely to leave.",
          body: "The quiet drop in activity gets noticed while there is still time to act on it.",
        },
        {
          title: "Questions in plain language.",
          body: 'Ask "how did Abuja do last month against target" and get the answer, without waiting for an analyst.',
        },
        {
          title: "Written summaries generated automatically.",
          body: "The numbers arrive with a short explanation of what moved and why it matters.",
        },
        {
          title: "What-if planning.",
          body: "Test a price change or a new branch on the model before you test it on the business.",
        },
      ],
      closingLine:
        "We add the forecasting your decisions actually need, and nothing you will not use.",
    },
    {
      kind: "rich",
      id: "process",
      heading: "How a dashboard project runs.",
      body: [
        "We start with your decisions, not your data. What do you decide weekly, monthly, quarterly, and what would you need to see to decide it well? Then we trace those needs back to your data sources, connect them, and design screens people will actually check every morning. If your data is not ready to support this, we will tell you plainly, because a dashboard built on numbers nobody trusts just makes arguments faster.",
      ],
    },
    {
      kind: "rich",
      id: "proof",
      heading: "What leadership sees after we ship.",
      body: [
        "One screen instead of four spreadsheets. Numbers the whole leadership team agrees on, because they come from one source. And warnings that arrive early: the stock that will run out, the customer going quiet, the cash flow dip two months ahead, while there is still time to act.",
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
      heading: "Where dashboards change the conversation.",
      note: "Cards: Manufacturing, Logistics, Retail, NGOs, Construction",
    },
    {
      kind: "faq",
      id: "faq",
      heading: "Asked by every decision maker we meet.",
      items: [
        {
          question: "Our data is a mess. Can you still build this?",
          answer:
            "We will tell you honestly after looking. Sometimes light cleaning along the way is enough. When it is not, the right first step is our data readiness service, because a dashboard cannot fix numbers nobody trusts, and we will not pretend otherwise.",
        },
        {
          question: "How accurate are the forecasts?",
          answer:
            'As accurate as your history allows, and we show the uncertainty rather than hiding it. A forecast that says "between 80 and 95" honestly beats one that says "92" confidently and wrongly.',
        },
        {
          question: "Can it pull from the tools we already use?",
          answer:
            "Yes. Accounting, sales, payment, and operations tools connect into one view. Connecting what you already have is most of the job.",
        },
        {
          question: "Will our team actually use it?",
          answer:
            "That is a design question, and it is why we start from decisions rather than data. A dashboard that answers a real Monday-morning question gets opened every Monday morning.",
        },
        {
          question: "What does it cost to run after launch?",
          answer:
            "A managed plan keeps the connections healthy, the forecasts tuned, and the reports flowing. Most clients take one, and the monthly cost is a fraction of one wrong decision made blind.",
        },
      ],
    },
    {
      kind: "cta-band",
      id: "cta-band",
      heading: "Stop waiting for the report. Open the page and know.",
      button: { label: "Design my dashboard", href: "/contact" },
    },
  ],
};
