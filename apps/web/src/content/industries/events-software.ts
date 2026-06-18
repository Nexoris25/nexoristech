/**
 * Events, Conferences & Weddings industry page, transcribed verbatim from the approved
 * Website Copy (Part 3).
 */
import type { MarketingPage } from "../types.js";

export const eventsSoftware: MarketingPage = {
  meta: {
    slug: "/events-software",
    routeClass: "industry",
    title: "Event Ticketing & Management Software | Nexoris Technologies",
    description:
      "Ticketing platforms, attendee apps, and QR check-in for conferences, weddings, and venues. Sell tickets faster, run the day smoother, and prove sponsor results.",
  },
  hero: {
    h1: "Sell out faster, check guests in smoothly, and give sponsors numbers they love.",
    subline:
      "We build ticketing platforms, attendee apps, and check-in systems for conference organisers, wedding planners, and venues. Tickets sell without the chaos, the entrance queue actually moves, and your sponsors get a report worth renewing for.",
    primaryCta: { label: "Talk to us about your event", href: "/contact" },
    secondaryCta: { label: "Find the right service", href: "#solution-finder" },
  },
  sections: [
    {
      kind: "cards",
      id: "pain",
      heading: "The event ends in a day. The chaos behind it lasts for months.",
      cards: [
        {
          body: "Registration is a Google form, a spreadsheet, and a prayer that they match.",
        },
        {
          body: "The queue at the entrance was the first thing every guest experienced.",
        },
        { body: "Eleven vendors, one WhatsApp group, zero accountability." },
        {
          body: "The sponsor asked what they got for their money. We sent photos.",
        },
      ],
      closingLine:
        "Great events feel effortless because a system carried the load. The guests remember the experience. You get to keep the data, the sponsors, and your sanity.",
    },
    {
      kind: "cards",
      id: "solutions",
      heading: "What we build for events.",
      cards: [
        {
          title: "Ticketing platforms.",
          body: "Tiers, early bird windows, group rates, and payments, selling smoothly from announcement to doors.",
        },
        {
          title: "Attendee apps.",
          body: "Agendas, maps, speakers, and networking in every guest's pocket.",
        },
        {
          title: "Digital RSVP and guest lists.",
          body: "For weddings and invitation events: who is coming, with how many, eating what, seated where.",
        },
        {
          title: "Vendor coordination portals.",
          body: "Every vendor's scope, deadlines, and deliveries tracked in one place instead of one group chat.",
        },
        {
          title: "QR check-in, with facial recognition where appropriate.",
          body: "The queue moves in seconds per guest, and gate-crashing gets hard.",
        },
        {
          title: "Sponsor dashboards.",
          body: "Impressions, scans, leads, and engagement, live during the event and reported after it.",
        },
        {
          title: "Livestream and hybrid tools.",
          body: "The audience beyond the room attending properly, not watching a shaky phone feed.",
        },
      ],
    },
    {
      kind: "cards",
      id: "ai-where-it-helps",
      heading: "Where AI can improve the experience.",
      cards: [
        {
          title: "Attendee matchmaking.",
          body: "The two people who should meet get introduced by the app, which is the part of conferences people actually pay for.",
        },
        {
          title: "Personal agendas.",
          body: "Each attendee's day arranged around their interests, automatically.",
        },
        {
          title: "A guest questions chatbot.",
          body: "Parking, timing, dress code, and WiFi answered instantly, a thousand times, without your team answering once.",
        },
        {
          title: "Live feedback monitored.",
          body: "The session going wrong surfaces while you can still fix the afternoon.",
        },
        {
          title: "Sponsor reports generated automatically.",
          body: "The renewal-winning report assembles itself from real event data the morning after.",
        },
      ],
      closingLine:
        "Useful where the event is big enough to need it. We will say if yours is not.",
    },
    {
      kind: "rich",
      id: "outcomes",
      heading: "What changes for the next event.",
      body: [
        "Tickets sell faster because buying takes a minute. The day runs smoothly because check-in, vendors, and schedules all answer to one system. Guests network better, sponsors see their return in numbers, and you walk away with clean data that makes the next event easier to sell.",
      ],
    },
    {
      kind: "dynamic",
      id: "services-links",
      heading: "Built with these services.",
      note: "Cards: AI Product Development, AI E-Commerce, Chatbots & Virtual Assistants, Dashboards & Analytics",
    },
    {
      kind: "rich",
      id: "proof",
      heading: "From organisers like yours.",
    },
    {
      kind: "dynamic",
      id: "proof-cards",
      note: "Case study cards from Strapi, filtered by industry tag, plus testimonial",
    },
    {
      kind: "faq",
      id: "faq",
      heading: "Asked by every organiser we meet.",
      items: [
        {
          question: "Can it handle a big rush when tickets drop or doors open?",
          answer:
            "Yes. The platform is built for spikes, and check-in keeps working offline if the venue WiFi gives up, which venues sometimes do.",
        },
        {
          question: "Does it work for weddings, not just conferences?",
          answer:
            "Yes. RSVP, plus-ones, meal choices, seating, and vendor coordination are wedding problems we build for directly.",
        },
        {
          question: "How do guests pay for tickets?",
          answer:
            "Cards, transfers, and USSD through Nigerian gateways, with every sale reconciled automatically and payouts visible to you.",
        },
        {
          question: "What do sponsors actually see?",
          answer:
            "A live dashboard during the event and a clean report after it: scans, leads, session numbers, and engagement. It is the difference between renewing a sponsor and re-pitching one.",
        },
        {
          question: "Can we reuse everything for the next edition?",
          answer:
            "Yes. Attendee data, sponsor history, and vendor records carry forward, so every edition starts further ahead than the last.",
        },
      ],
    },
    {
      kind: "cta-band",
      id: "cta-band",
      heading:
        "The event ends. The data, the sponsors, and the reputation should carry forward. We build it so they do.",
      button: { label: "Talk to us about your event", href: "/contact" },
    },
  ],
};
