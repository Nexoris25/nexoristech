/**
 * Fitness, Wellness, Beauty, Salons & Spas industry page, transcribed verbatim from the
 * approved Website Copy (Part 3).
 */
import type { MarketingPage } from "../types.js";

export const fitnessWellnessSoftware: MarketingPage = {
  meta: {
    slug: "/fitness-wellness-software",
    routeClass: "industry",
    title: "Salon, Spa & Gym Software | Nexoris Technologies",
    description:
      "Booking apps, membership systems, and loyalty programmes for gyms, salons, and spas. Fewer no-shows, fuller calendars, and clients who keep coming back to you.",
  },
  hero: {
    h1: "Keep your calendar full and your regulars loyal.",
    subline:
      "We build booking apps, membership systems, and loyalty programmes for gyms, salons, spas, and wellness centres. Empty slots fill up, no-shows drop, and the client who quietly stopped coming gets a well-timed reason to return.",
    primaryCta: { label: "Talk to us about your business", href: "/contact" },
    secondaryCta: { label: "Find the right service", href: "#solution-finder" },
  },
  sections: [
    {
      kind: "cards",
      id: "pain",
      heading: "An empty slot is revenue you never get back.",
      cards: [
        {
          body: "Three no-shows today. That chair earned nothing for three hours, and the stylist still got paid.",
        },
        {
          body: "She came every two weeks for a year. Then she stopped, and nobody noticed for two months.",
        },
        { body: "Two clients, one slot, and the apology is mine to make." },
        {
          body: "Products walk out of the store room, and the loyalty cards are in a drawer somewhere.",
        },
      ],
      closingLine:
        "This business sells time, and time does not keep. The system below defends every slot, every membership, and every regular, automatically.",
    },
    {
      kind: "cards",
      id: "solutions",
      heading: "What we build for the industry.",
      cards: [
        {
          title: "Booking and appointment apps.",
          body: "Clients book themselves in at midnight from the sofa, with reminders that actually get them through the door.",
        },
        {
          title: "Membership management.",
          body: "Plans, renewals, and freezes handled cleanly, with the revenue picture always current.",
        },
        {
          title: "Tills with tipping built in.",
          body: "Payment, tips, and commissions captured in one flow at the front desk.",
        },
        {
          title: "Loyalty and referral programmes.",
          body: "The regular gets rewarded and the referral gets tracked, automatically, not from a drawer.",
        },
        {
          title: "Stock control for products and consumables.",
          body: "Retail and back-bar tracked, so shrinkage shows and reordering happens on time.",
        },
        {
          title: "Staff commission tracking.",
          body: "Every service tied to its provider, so payday is arithmetic instead of negotiation.",
        },
        {
          title: "Class and session schedules.",
          body: "Capacities, waitlists, and instructor changes managed without the noticeboard.",
        },
      ],
    },
    {
      kind: "cards",
      id: "ai-where-it-helps",
      heading: "Where AI can fill the calendar.",
      cards: [
        {
          title: "Plans matched to each client.",
          body: "Workout and wellness programmes shaped to the individual, which is what keeps memberships alive.",
        },
        {
          title: "Smarter scheduling and quiet-hour pricing.",
          body: "The calendar packs itself better, and the slow Tuesday morning earns something.",
        },
        {
          title: "Drift warnings with a well-timed nudge.",
          body: "The regular who is fading gets a personal reason to return, sent while it still works.",
        },
        {
          title: "A consultation chatbot.",
          body: "The common questions about treatments, products, and prep answered instantly.",
        },
        {
          title: "Review monitoring.",
          body: "Every review read and summarised, so you know what clients are saying without trawling for it.",
        },
      ],
      closingLine: "Pick the ones that suit your clientele. Skip the rest.",
    },
    {
      kind: "rich",
      id: "outcomes",
      heading: "What changes month to month.",
      body: [
        "The calendar fills and stays filled, no-shows drop because reminders land properly, regulars stay regular because their fading gets noticed, referrals grow because the programme finally runs itself, and each staff member's numbers are clear to everyone, including them.",
      ],
    },
    {
      kind: "dynamic",
      id: "services-links",
      heading: "Built with these services.",
      note: "Cards: AI Product Development, AI E-Commerce, Chatbots & Virtual Assistants, Dashboards & Analytics, Managed Technology Operations",
    },
    {
      kind: "rich",
      id: "proof",
      heading: "From businesses like yours.",
    },
    {
      kind: "dynamic",
      id: "proof-cards",
      note: "Case study cards from Strapi, filtered by industry tag, plus testimonial",
    },
    {
      kind: "faq",
      id: "faq",
      heading: "Asked by every owner and studio manager we meet.",
      items: [
        {
          question: "Do booking reminders really reduce no-shows?",
          answer:
            "Yes, reliably, especially on WhatsApp and SMS where people actually look. Add a simple deposit option for repeat offenders and the problem largely ends.",
        },
        {
          question:
            "Can clients book on Instagram and WhatsApp, where they find us?",
          answer:
            "Yes. Links from your social profiles drop clients straight into the booking flow, and the conversation channels connect to the same calendar.",
        },
        {
          question:
            "How does commission tracking handle our split arrangements?",
          answer:
            "Each provider's rates and splits are configured once, every service records its provider automatically, and payday becomes a report rather than a recalculation.",
        },
        {
          question: "Can it run multiple locations?",
          answer:
            "Yes. Each location runs its own calendar and team, and you see all of them side by side, with clients able to book any branch.",
        },
        {
          question: "What about deposits and our cancellation policy?",
          answer:
            "Both are built into the booking flow: deposits collected where you choose, your policy displayed and enforced consistently, with the awkward conversation handled by the system instead of the front desk.",
        },
      ],
    },
    {
      kind: "cta-band",
      id: "cta-band",
      heading:
        "Defend every appointment slot like the revenue it is. We will build the system that does it for you.",
      button: { label: "Talk to us about your business", href: "/contact" },
    },
  ],
};
