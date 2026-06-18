/**
 * Manufacturing & Industrial industry page, transcribed verbatim from the approved Website
 * Copy (Part 3).
 */
import type { MarketingPage } from "../types.js";

export const manufacturingSoftware: MarketingPage = {
  meta: {
    slug: "/manufacturing-software",
    routeClass: "industry",
    title: "Manufacturing ERP & Software | Nexoris Technologies",
    description:
      "Manufacturing ERP, production tracking, and factory dashboards with early breakdown warnings and quality checks. Get far more from the machines you already own.",
  },
  hero: {
    h1: "Catch the breakdown before it stops your line.",
    subline:
      "We build manufacturing ERP, production tracking, and factory floor dashboards for producers in food, pharma, plastics, and metals. Your machines warn you before they fail, your quality numbers arrive in real time, and procurement, production, and finance finally look at the same picture.",
    primaryCta: { label: "Talk to us about your plant", href: "/contact" },
    secondaryCta: { label: "Find the right service", href: "#solution-finder" },
  },
  sections: [
    {
      kind: "cards",
      id: "pain",
      heading: "Unplanned downtime never sends a calendar invite.",
      cards: [
        {
          body: "The machine stopped at 2pm. The line stopped with it. The deliveries stopped after that.",
        },
        {
          body: "Quality varies batch to batch, and we find out from the complaints.",
        },
        {
          body: "Production reports get compiled by hand, a day late, from numbers someone wrote down.",
        },
        {
          body: "A customer asked us to trace a batch. It took four days and a lot of folders.",
        },
      ],
      closingLine:
        "A plant generates signals all day long. The difference between a good month and a bad one is whether anything is listening.",
    },
    {
      kind: "cards",
      id: "solutions",
      heading: "What we build for manufacturers.",
      cards: [
        {
          title: "Manufacturing ERP.",
          body: "Procurement, production, inventory, and finance on one system, so the plant and the office stop arguing about numbers.",
        },
        {
          title: "Production execution systems.",
          body: "What is being made, on which line, against which order, live.",
        },
        {
          title: "Factory floor dashboards.",
          body: "Output, downtime, and quality visible on the floor and in the office at the same moment.",
        },
        {
          title: "Quality management.",
          body: "Checks, results, and deviations recorded at the line, with traceability built in batch by batch.",
        },
        {
          title: "Warehouse and stock management.",
          body: "Raw materials and finished goods tracked from gate to gate.",
        },
        {
          title: "Maintenance management.",
          body: "Schedules, histories, and spares organised, so maintenance happens on plan instead of in panic.",
        },
        {
          title: "Procurement and supplier portals.",
          body: "Orders, deliveries, and supplier performance managed in one place.",
        },
      ],
    },
    {
      kind: "cards",
      id: "ai-where-it-helps",
      heading: "Where AI can keep the line running.",
      cards: [
        {
          title: "Breakdown warnings from sensor data.",
          body: "The vibration and temperature pattern that comes before a failure gets recognised in time to service on your schedule.",
        },
        {
          title: "Cameras that catch defects.",
          body: "Quality problems spotted at the line, not at the customer.",
        },
        {
          title: "Demand and production planning.",
          body: "Output planned against real demand signals, which protects both stock and delivery dates.",
        },
        {
          title: "Energy use trimmed.",
          body: "Where the power actually goes, and where it does not need to.",
        },
        {
          title: "Quality reports written automatically.",
          body: "The batch documentation assembles itself from the data already collected.",
        },
        {
          title: "Supplier risk scoring.",
          body: "The supplier about to become a problem gets flagged before the line feels it.",
        },
      ],
      closingLine:
        "Start with the machines that hurt most when they stop. Expand from there.",
    },
    {
      kind: "rich",
      id: "outcomes",
      heading: "What changes on the floor.",
      body: [
        "Downtime falls because maintenance moved ahead of failure. Output rises from the same machines, scrap and rework shrink, and any batch can be traced end to end in minutes. And for the first time, the plant, the warehouse, and the finance office are looking at one set of numbers.",
      ],
    },
    {
      kind: "dynamic",
      id: "services-links",
      heading: "Built with these services.",
      note: "Cards: IoT Development, AI Product Development, Dashboards & Analytics, AI & Systems Integration, Managed Technology Operations",
    },
    {
      kind: "rich",
      id: "proof",
      heading: "From plants like yours.",
    },
    {
      kind: "dynamic",
      id: "proof-cards",
      note: "Case study cards from Strapi, filtered by industry tag, plus testimonial",
    },
    {
      kind: "faq",
      id: "faq",
      heading: "Asked by every plant manager we meet.",
      items: [
        {
          question: "Our machines are old. Can they still be monitored?",
          answer:
            "Almost always. Sensors retrofit onto older equipment, and even simple measurements like vibration, temperature, and power draw tell you most of what matters. The audit confirms what your specific machines can give us.",
        },
        {
          question: "Will this disrupt production during rollout?",
          answer:
            "No. Monitoring installs around the production schedule, and the software rollout runs alongside your current process until the team trusts it. The line keeps running throughout.",
        },
        {
          question:
            "Can it handle batch traceability for our auditors and export customers?",
          answer:
            "Yes. Every batch carries its materials, line, checks, and results, and a trace that took days becomes a report that takes minutes.",
        },
        {
          question: "Do operators on the floor actually use these systems?",
          answer:
            "When they are designed for the floor, yes: large clear screens, minimal typing, and entries that take seconds. We design for the operator first, because a system the floor ignores is just an expensive report.",
        },
        {
          question:
            "Where do we start if the budget will not cover everything?",
          answer:
            "With the line or machine whose downtime costs most. The first phase pays for itself there, and the result funds the argument for the rest.",
        },
      ],
    },
    {
      kind: "cta-band",
      id: "cta-band",
      heading:
        "Your machines have been giving warnings all along. Let us build the system that reads them.",
      button: { label: "Talk to us about your plant", href: "/contact" },
    },
  ],
};
