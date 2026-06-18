/**
 * Restaurants, QSR & Cloud Kitchens industry page, transcribed verbatim from the approved
 * Website Copy (Part 3).
 */
import type { MarketingPage } from "../types.js";

export const restaurantSoftware: MarketingPage = {
  meta: {
    slug: "/restaurant-software",
    routeClass: "industry",
    title: "Restaurant POS & Ordering Software | Nexoris Technologies",
    description:
      "POS systems, online ordering, kitchen screens, and delivery tracking for restaurants, chains, and cloud kitchens. Cut food waste and grow repeat orders fast.",
  },
  hero: {
    h1: "Get food out faster, waste less of it, and keep people coming back.",
    subline:
      "We build the systems behind well-run food businesses: tills, online ordering, kitchen screens, rider dispatch, and stock control with proper recipe costing. You see what every branch is doing, what every dish actually earns, and roughly how busy tomorrow will be.",
    primaryCta: { label: "Talk to us about your restaurant", href: "/contact" },
    secondaryCta: { label: "Find the right service", href: "#solution-finder" },
  },
  sections: [
    {
      kind: "cards",
      id: "pain",
      heading: "Thin margins do not survive guesswork.",
      cards: [
        {
          body: "We prepped for a busy Saturday. It rained. The waste went in the bin with the margin.",
        },
        {
          body: "The order said no pepper. The kitchen ticket said something else.",
        },
        {
          body: "Our three branches feel like three different restaurants wearing one name.",
        },
        { body: "That promotion got abused so well it cost us money." },
      ],
      closingLine:
        "Food businesses live and die on small percentages. The right system protects every one of them, order by order, branch by branch.",
    },
    {
      kind: "cards",
      id: "solutions",
      heading: "What we build for food businesses.",
      cards: [
        {
          title: "Point-of-sale systems.",
          body: "Fast, accurate order-taking that talks directly to the kitchen and the books.",
        },
        {
          title: "Online ordering for web and mobile.",
          body: "Your own ordering channel, your own customer data, no aggregator commission on every plate.",
        },
        {
          title: "Kitchen display screens.",
          body: "Orders flow to the right station in sequence, legible and unmissable, with timing visible.",
        },
        {
          title: "Rider dispatch and delivery tracking.",
          body: "The right rider gets the right order, and the customer watches it arrive.",
        },
        {
          title: "Stock control and recipe costing.",
          body: "Every dish costed by ingredient, so you know what each item on the menu actually earns.",
        },
        {
          title: "One console for all branches.",
          body: "Menus, prices, and performance managed centrally, with every branch visible side by side.",
        },
        {
          title: "Loyalty and referral programmes.",
          body: "The customer who orders twice gets a reason to order weekly.",
        },
        {
          title: "QR ordering at the table.",
          body: "Guests order and pay from their seats, and your floor staff cover more tables better.",
        },
      ],
    },
    {
      kind: "cards",
      id: "ai-where-it-helps",
      heading: "Where AI can protect your margin.",
      cards: [
        {
          title: "Demand forecasts by time of day.",
          body: "Prep matched to what each day-part will actually sell, which is where the waste fight is won.",
        },
        {
          title: "Menu analysis.",
          body: "Which dishes earn, which just occupy the menu, and what a small price change would do.",
        },
        {
          title: "Voice order-taking.",
          body: "Phone and drive-through orders captured accurately without holding a staff member at the line.",
        },
        {
          title: "Promotion abuse alerts.",
          body: "The discount pattern that does not look like a customer gets flagged early.",
        },
        {
          title: "Suggestions for repeat customers.",
          body: "The regular sees their usual and one thing they will probably like.",
        },
        {
          title: "Smarter rider assignment.",
          body: "Orders, locations, and timing matched so food travels hot and short.",
        },
      ],
      closingLine:
        "Start with the ones your numbers justify. Add the rest when they earn it.",
    },
    {
      kind: "rich",
      id: "outcomes",
      heading: "What changes by month three.",
      body: [
        "Food cost comes down because prep follows the forecast. Orders reach tables and doorsteps faster and more accurately. Repeat orders climb because the loyalty loop finally exists. And for the first time you can put the branches side by side and see, in numbers, what each one earns.",
      ],
    },
    {
      kind: "dynamic",
      id: "services-links",
      heading: "Built with these services.",
      note: "Cards: AI Product Development, AI E-Commerce, Business Process Automation, Dashboards & Analytics, Managed Technology Operations",
    },
    {
      kind: "rich",
      id: "proof",
      heading: "From kitchens like yours.",
    },
    {
      kind: "dynamic",
      id: "proof-cards",
      note: "Case study cards from Strapi, filtered by industry tag, plus testimonial",
    },
    {
      kind: "faq",
      id: "faq",
      heading: "Asked by every restaurant operator we meet.",
      items: [
        {
          question:
            "Can we take orders on our own site instead of paying aggregator commission?",
          answer:
            "Yes, and for most restaurants that is the fastest payback in the whole project. The aggregators stay useful for discovery; your own channel keeps the margin and the customer data.",
        },
        {
          question: "Does it work for a cloud kitchen running several brands?",
          answer:
            "Yes. Multiple brands, one kitchen, separate menus and channels, one operational view. That model is built in.",
        },
        {
          question: "Will it handle our recipes and portioning for costing?",
          answer:
            "Yes. Each dish is costed by ingredient and portion, so stock moves with sales automatically and the menu report shows true margins, not guesses.",
        },
        {
          question: "What happens during a rush when the network drops?",
          answer:
            "The till keeps taking orders offline and syncs when the connection returns. A busy Friday cannot depend on the router.",
        },
        {
          question:
            "We have branches in different cities. Can we manage them centrally?",
          answer:
            "Yes. Menus, prices, and promotions push from the centre, performance flows back, and a branch cannot quietly drift from the standard.",
        },
      ],
    },
    {
      kind: "cta-band",
      id: "cta-band",
      heading:
        "Wasted food is profit in the bin. Forecast it properly and serve it instead.",
      button: { label: "Talk to us about your restaurant", href: "/contact" },
    },
  ],
};
