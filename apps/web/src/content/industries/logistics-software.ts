/**
 * Logistics, Transport & Supply Chain industry page, transcribed verbatim from the approved
 * Website Copy (Part 3).
 */
import type { MarketingPage } from "../types.js";

export const logisticsSoftware: MarketingPage = {
  meta: {
    slug: "/logistics-software",
    routeClass: "industry",
    title: "Fleet & Logistics Software in Nigeria | Nexoris Technologies",
    description:
      "Fleet tracking, transport management, driver apps, and cold chain monitoring for haulage and delivery firms. Cut fuel cost and deliver on time, every time.",
  },
  hero: {
    h1: "Know where every vehicle is and what it is costing you, right now.",
    subline:
      "We build fleet platforms, transport management systems, and tracking portals for haulage, delivery, and cold chain operators. You see every vehicle live, your customers track their own shipments without calling you, and fuel stops disappearing between depots.",
    primaryCta: { label: "Talk to us about your fleet", href: "/contact" },
    secondaryCta: { label: "Find the right service", href: "#solution-finder" },
  },
  sections: [
    {
      kind: "cards",
      id: "pain",
      heading: "Fuel theft and quiet detours thrive in the dark.",
      cards: [
        {
          body: "Where is the truck? The honest answer is that we will know when the driver calls.",
        },
        {
          body: "The fuel figures never add up, and everyone has a theory about why.",
        },
        {
          body: "Proof of delivery is a paper sheet that arrives back days later, sometimes.",
        },
        {
          body: "Two vehicles are always in the workshop. Which two changes weekly.",
        },
      ],
      closingLine:
        "Operations run on visibility. Once everyone knows the system is watching, half the problems stop happening on their own. The system handles the other half.",
    },
    {
      kind: "cards",
      id: "solutions",
      heading: "What we build for logistics.",
      cards: [
        {
          title: "Fleet management platforms.",
          body: "Every vehicle live on a map, with history, costs, and documents behind each one.",
        },
        {
          title: "Transport management systems.",
          body: "Jobs, loads, routes, and billing planned and tracked in one place.",
        },
        {
          title: "Dispatcher dashboards.",
          body: "The whole operation on one screen, with problems surfacing before customers call about them.",
        },
        {
          title: "Driver apps with proof of delivery.",
          body: "Photos, signatures, and timestamps captured at the doorstep, synced instantly.",
        },
        {
          title: "Tracking portals for customers.",
          body: "Customers see their own shipments, which ends most of the calls.",
        },
        {
          title: "Cold chain monitoring.",
          body: "Temperature watched continuously, with alerts before the cargo pays for a drift.",
        },
        {
          title: "Warehouse connections.",
          body: "What is on the shelf and what is on the road, in one picture.",
        },
      ],
    },
    {
      kind: "cards",
      id: "ai-where-it-helps",
      heading: "Where AI can save fuel and time.",
      cards: [
        {
          title: "Smarter routes and load planning.",
          body: "Plans built from real traffic and real history, not the map's optimism.",
        },
        {
          title: "Maintenance alerts from telemetry.",
          body: "The truck that is about to become a problem gets serviced before it becomes one.",
        },
        {
          title: "Arrival estimates customers can trust.",
          body: "Honest ETAs, updated as conditions change.",
        },
        {
          title: "Driver behaviour scoring.",
          body: "Harsh braking, speeding, and idling measured fairly, so coaching has numbers behind it.",
        },
        {
          title: "Drift alerts on temperature and vibration.",
          body: "The cold chain protected by the second, not by the spot check.",
        },
        {
          title: "Customs documents generated automatically.",
          body: "Cross-border paperwork assembled from the shipment record.",
        },
        {
          title: "Fuel efficiency analysis.",
          body: "Where the diesel actually goes, vehicle by vehicle, route by route.",
        },
      ],
      closingLine:
        "Plain tracking alone already changes behaviour. The rest is there when you want it.",
    },
    {
      kind: "rich",
      id: "outcomes",
      heading: "What changes across the fleet.",
      body: [
        "Fuel and maintenance costs come down, and on-time delivery goes up. Every vehicle does more work because downtime gets planned instead of suffered. Cargo losses shrink, and your customers stop calling for updates because the answer is already on their screen.",
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
      heading: "From operators like yours.",
    },
    {
      kind: "dynamic",
      id: "proof-cards",
      note: "Case study cards from Strapi, filtered by industry tag, plus testimonial",
    },
    {
      kind: "faq",
      id: "faq",
      heading: "Asked by every fleet owner we meet.",
      items: [
        {
          question: "Will this actually stop fuel theft?",
          answer:
            "It removes the cover. Fuel levels, routes, and stops are all recorded, so losses become visible, attributable, and rare. Most operators see the change within the first weeks, partly because behaviour changes the day the system goes live.",
        },
        {
          question: "We already have trackers. Do we start over?",
          answer:
            "Usually not. Many fleets have tracking hardware and lack the platform that makes it useful. We can often build on the devices you have.",
        },
        {
          question: "Does it work where network coverage is poor?",
          answer:
            "Yes. Devices record locally and sync when coverage returns, and critical alerts can travel by SMS. Nigerian routes are exactly what we design for.",
        },
        {
          question: "Can our customers track their own shipments?",
          answer:
            "Yes, through their own portal or a simple link. It is the feature that pays back fastest in customer goodwill and saved phone time.",
        },
        {
          question: "What about cold chain compliance records?",
          answer:
            "Temperature history is logged continuously and exportable per shipment, so the compliance evidence your customers demand is a button, not a scramble.",
        },
      ],
    },
    {
      kind: "cta-band",
      id: "cta-band",
      heading:
        "Turn the lights on across your operation and watch what stops happening.",
      button: { label: "Talk to us about your fleet", href: "/contact" },
    },
  ],
};
