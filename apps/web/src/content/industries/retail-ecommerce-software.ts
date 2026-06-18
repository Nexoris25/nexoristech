/**
 * Retail & E-Commerce industry page, transcribed verbatim from the approved Website Copy
 * (Part 3).
 */
import type { MarketingPage } from "../types.js";

export const retailEcommerceSoftware: MarketingPage = {
  meta: {
    slug: "/retail-ecommerce-software",
    routeClass: "industry",
    title: "Retail & E-Commerce Software | Nexoris Technologies",
    description:
      "Online stores, stock systems, and connected tills for retailers and brands in Nigeria. Get one clear view of every channel you sell on, online and in person.",
  },
  hero: {
    h1: "Stop running out of the products people actually want to buy.",
    subline:
      "We build online stores, stock systems, and connected tills for brands, distributors, and marketplaces. Your stock follows real demand, your online and physical channels finally agree with each other, and customers who bought once get a good reason to come back.",
    primaryCta: {
      label: "Talk to us about your retail business",
      href: "/contact",
    },
    secondaryCta: { label: "Find the right service", href: "#solution-finder" },
  },
  sections: [
    {
      kind: "cards",
      id: "pain",
      heading:
        "Stockouts lose the sale. Overstock eats the cash. You live between the two.",
      cards: [
        {
          body: "The bestseller sold out on Tuesday. The container of slow movers is still in the warehouse.",
        },
        {
          body: "The website says we have it. The shop sold the last one an hour ago.",
        },
        {
          body: "We pay real money to acquire a customer, they buy once, and that is the last we see of them.",
        },
        {
          body: "Month-end means matching the till, the website, and the accounts by hand. It takes days.",
        },
      ],
      closingLine:
        "Retail rewards the businesses that know their numbers in real time. The system below is how you become one of them.",
    },
    {
      kind: "cards",
      id: "solutions",
      heading: "What we build for retail.",
      cards: [
        {
          title: "Custom online stores.",
          body: "For complex catalogues, multiple sellers, or models a template cannot hold.",
        },
        {
          title: "Shopify and WooCommerce stores.",
          body: "When speed to launch matters more than custom machinery, and we will say so honestly.",
        },
        {
          title: "Shopping apps.",
          body: "Your store in the customer's pocket, with notifications that bring them back.",
        },
        {
          title: "Stock and warehouse management.",
          body: "What you have, where it is, and what it is doing, in real time.",
        },
        {
          title: "Tills connected to your online store.",
          body: "One stock count, one customer record, across the shop floor and the website.",
        },
        {
          title: "Wholesale portals.",
          body: "Business buyers get their prices, terms, and ordering without the phone calls.",
        },
        {
          title: "Loyalty and customer management.",
          body: "The data to know your best customers and the tools to keep them.",
        },
        {
          title: "Marketplace platforms.",
          body: "When the model is many sellers and you are the platform.",
        },
      ],
    },
    {
      kind: "cards",
      id: "ai-where-it-helps",
      heading: "Where AI can grow the basket.",
      cards: [
        {
          title: "Product suggestions per shopper.",
          body: "The store learns what each customer likes and shows more of it.",
        },
        {
          title: "Search by photo.",
          body: "The customer finds the product they saw, even without the words for it.",
        },
        {
          title: "Descriptions written and translated automatically.",
          body: "A large catalogue described properly in days.",
        },
        {
          title: "Stock forecasts.",
          body: "Reorder before the shelf empties, stop buying what is piling up.",
        },
        {
          title: "Prices that respond to demand.",
          body: "Margin held where things sell, movement created where they do not.",
        },
        {
          title: "Payment fraud checks.",
          body: "The order that does not look right gets a second look before it ships.",
        },
        {
          title: "Abandoned cart follow-ups.",
          body: "The nudge that brings shoppers back, sent automatically at the right moment.",
        },
      ],
      closingLine:
        "Each one is optional, and we will tell you which ones your sales data supports.",
    },
    {
      kind: "rich",
      id: "outcomes",
      heading: "What changes across the quarter.",
      body: [
        "Average orders grow because the right products meet the right shopper. Stockouts and dead stock both shrink because buying follows the forecast. Repeat purchases climb, customer lifetime value follows, and month-end reconciliation becomes a report you read instead of a project you survive.",
      ],
    },
    {
      kind: "dynamic",
      id: "services-links",
      heading: "Built with these services.",
      note: "Cards: AI E-Commerce, AI Product Development, AI & Systems Integration, Dashboards & Analytics, Managed Technology Operations",
    },
    {
      kind: "rich",
      id: "proof",
      heading: "From retailers like yours.",
    },
    {
      kind: "dynamic",
      id: "proof-cards",
      note: "Case study cards from Strapi, filtered by industry tag, plus testimonial",
    },
    {
      kind: "faq",
      id: "faq",
      heading: "Asked by every retail founder we meet.",
      items: [
        {
          question:
            "Can the shop and the website really share one stock count?",
          answer:
            "Yes, live. A sale in either place updates both instantly, which ends the embarrassing call where the website sold something the shop no longer has.",
        },
        {
          question: "We sell on Instagram and WhatsApp too. Does that fit?",
          answer:
            "Yes. Social orders flow into the same order and stock system, so social selling stops being a parallel business run from a phone.",
        },
        {
          question: "Shopify or custom: which do we need?",
          answer:
            "If your catalogue and model are straightforward, Shopify gets you live in weeks and we will say so. Custom earns its cost when your pricing, catalogue, or model will not fit a template. The honest answer is part of the first call.",
        },
        {
          question: "Can it handle wholesale and retail together?",
          answer:
            "Yes. Retail customers see retail prices, wholesale buyers log into their own portal with their own terms, and one stock count serves both.",
        },
        {
          question: "What about deliveries?",
          answer:
            "We integrate with delivery providers, or build dispatch and tracking into the platform when your volume justifies running your own riders.",
        },
      ],
    },
    {
      kind: "cta-band",
      id: "cta-band",
      heading:
        "There is a smarter point between sold out and overstocked. We build the system that finds it.",
      button: {
        label: "Talk to us about your retail business",
        href: "/contact",
      },
    },
  ],
};
