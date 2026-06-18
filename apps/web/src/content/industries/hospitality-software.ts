/**
 * Hospitality, Hotels & Short-Lets industry page, transcribed verbatim from the approved
 * Website Copy (Part 3).
 */
import type { MarketingPage } from "../types.js";

export const hospitalitySoftware: MarketingPage = {
  meta: {
    slug: "/hospitality-software",
    routeClass: "industry",
    title: "Hotel & Short-Let Software in Nigeria | Nexoris Technologies",
    description:
      "Hotel management systems, booking engines, and guest apps for hotels and short-let operators. Keep channels in sync and grow direct, commission-free booking.",
  },
  hero: {
    h1: "Fill your rooms, look after your guests, and never double book again.",
    subline:
      "We build hotel management systems, booking engines, and guest apps for hotels, resorts, and short-let operators. Your booking channels stay in sync, your prices follow demand, and more guests book with you directly instead of through sites that take a commission.",
    primaryCta: { label: "Talk to us about your property", href: "/contact" },
    secondaryCta: { label: "Find the right service", href: "#solution-finder" },
  },
  sections: [
    {
      kind: "cards",
      id: "pain",
      heading: "Anyone who has handled a double booking knows the feeling.",
      cards: [
        {
          body: "Two guests, one room, and both of them holding confirmations.",
        },
        {
          body: "Rates get updated by hand across three sites, when someone remembers.",
        },
        {
          body: "Bookings arrive from Booking.com, Airbnb, WhatsApp, and walk-ins, and front desk holds it together from memory.",
        },
        {
          body: "Guests stay once, leave happy, and we never hear from them again.",
        },
      ],
      closingLine:
        "A property can be wonderful and still leak money through its systems. The fix is one platform where every channel, rate, and guest lives together.",
    },
    {
      kind: "cards",
      id: "solutions",
      heading: "What we build for hospitality.",
      cards: [
        {
          title: "Property management systems.",
          body: "Rooms, rates, reservations, and housekeeping on one screen, for one property or a group.",
        },
        {
          title: "A booking engine for your own website.",
          body: "Guests book directly with you, commission-free, in a flow that works on a phone.",
        },
        {
          title: "A channel manager.",
          body: "Booking.com, Airbnb, and the rest stay in sync automatically. The double booking becomes structurally impossible.",
        },
        {
          title: "Guest apps with mobile check-in and digital keys.",
          body: "Guests skip the queue and start their stay at the lift.",
        },
        {
          title: "Housekeeping coordination.",
          body: "Room status flows between front desk and housekeeping in real time, without the radio calls.",
        },
        {
          title: "Restaurant and bar tills.",
          body: "Charges land on the right room and the right bill automatically.",
        },
        {
          title: "Loyalty programmes.",
          body: "The guest who came twice gets a reason to come a third time.",
        },
      ],
    },
    {
      kind: "cards",
      id: "ai-where-it-helps",
      heading: "Where AI can lift your revenue.",
      cards: [
        {
          title: "Room prices that follow demand.",
          body: "Rates adjust to season, events, and booking pace, so you stop leaving money on full nights and rooms empty on slow ones.",
        },
        {
          title: "Occupancy forecasts.",
          body: "Staffing and purchasing planned against what is coming, not what last month looked like.",
        },
        {
          title: "A concierge chatbot.",
          body: "Guest questions answered instantly before, during, and after the stay, and bookings taken in the same conversation.",
        },
        {
          title: "Upsell suggestions.",
          body: "The right guest gets offered the room upgrade or the late checkout, at the moment they are most likely to say yes.",
        },
        {
          title: "Review monitoring.",
          body: "Every review read and summarised, so you know how guests really feel without trawling five platforms.",
        },
      ],
      closingLine:
        "Pick what fits your property. We will tell you what each one is likely to earn.",
    },
    {
      kind: "rich",
      id: "outcomes",
      heading: "What changes by next season.",
      body: [
        "More earned per available room, because pricing finally moves with demand. A bigger share of bookings coming direct, which is margin straight back to you. Fewer cancellations and no-shows, stronger reviews, and guests who return, because the property that remembers them earned it.",
      ],
    },
    {
      kind: "dynamic",
      id: "services-links",
      heading: "Built with these services.",
      note: "Cards: AI Product Development, AI E-Commerce, Chatbots & Virtual Assistants, AI Content SEO & GEO, Managed Technology Operations",
    },
    {
      kind: "rich",
      id: "proof",
      heading: "From properties like yours.",
    },
    {
      kind: "dynamic",
      id: "proof-cards",
      note: "Case study cards from Strapi, filtered by industry tag, plus testimonial",
    },
    {
      kind: "faq",
      id: "faq",
      heading: "Asked by every hotel owner and manager we meet.",
      items: [
        {
          question: "Will this really stop double bookings?",
          answer:
            "Yes. Every channel draws from one live availability count, so the same room cannot be sold twice. This is the single most common reason properties come to us, and it is fully solvable.",
        },
        {
          question: "Can we keep using Booking.com and Airbnb?",
          answer:
            "Yes, and you should, as one source among several. The goal is balance: keep the reach of the platforms while growing the direct share that costs you no commission.",
        },
        {
          question: "Does it work for short-lets and serviced apartments?",
          answer:
            "Yes. Multiple units, different owners, cleaning turnarounds between guests: the short-let workflow is built in, not adapted from hotels.",
        },
        {
          question: "What about our restaurant and bar?",
          answer:
            "Tills connect to the same system, so a drink at the bar lands on the room bill automatically and the month-end picture includes everything.",
        },
        {
          question: "How disruptive is the switchover?",
          answer:
            "Minimal by design. We run the new system alongside your current process, move channels over one at a time, and train the front desk before anything depends on them.",
        },
      ],
    },
    {
      kind: "cta-band",
      id: "cta-band",
      heading:
        "Every commission you pay a booking site is margin you could keep. Let us help you take it back.",
      button: { label: "Talk to us about your property", href: "/contact" },
    },
  ],
};
