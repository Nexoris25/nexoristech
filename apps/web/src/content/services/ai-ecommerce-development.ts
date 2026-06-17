/**
 * AI E-Commerce Development service page, transcribed verbatim from the approved Website
 * Copy (Part 2).
 */
import type { MarketingPage } from "../types.js";

export const aiEcommerceDevelopment: MarketingPage = {
  meta: {
    slug: "/ai-ecommerce-development",
    routeClass: "service",
    title: "E-Commerce Website Development | Nexoris Technologies",
    description:
      "Custom online stores plus Shopify and WooCommerce builds, with smart product recommendations, live stock forecasting, and abandoned cart recovery from day one.",
  },
  hero: {
    h1: "An online store that keeps selling after you close for the day.",
    subline:
      "We build online stores and marketplaces: custom platforms when your catalogue is complex, Shopify or WooCommerce when you need to launch quickly, and honest advice about which one you actually need. Smart features like recommendations and stock forecasting are there from the start, not promised for later.",
    primaryCta: { label: "Plan my store", href: "/contact" },
    secondaryCta: { label: "Find the right service", href: "#solution-finder" },
  },
  sections: [
    {
      kind: "cards",
      id: "pain",
      heading: "Your store is losing sales in places you cannot see.",
      cards: [
        {
          body: "People fill their carts and vanish at checkout. We never find out why.",
        },
        { body: "Our bestseller was out of stock for nine days. Nine days." },
        {
          body: "We pay for ads, customers buy once, and we never see them again.",
        },
      ],
      closingLine:
        "None of these are mysteries. They are measurable leaks, and a properly built store closes them one by one.",
    },
    {
      kind: "cards",
      id: "scope",
      heading: "What we build.",
      cards: [
        {
          title: "Custom online stores and marketplaces.",
          body: "For complex catalogues, multiple sellers, or business models that off-the-shelf platforms cannot hold.",
        },
        {
          title: "Shopify and WooCommerce stores.",
          body: "Design, development, and migration when speed to launch matters more than custom machinery. We will tell you honestly when this is the right answer.",
        },
        {
          title: "Wholesale portals.",
          body: "Business customers get their own prices, credit terms, and ordering, without phone calls and spreadsheets.",
        },
        {
          title: "Connected channels.",
          body: "Your website, your app, and your physical shop tills sharing one stock count and one customer record.",
        },
        {
          title: "Subscriptions and recurring billing.",
          body: "For products people buy on a rhythm, the store remembers so the customer does not have to.",
        },
      ],
    },
    {
      kind: "cards",
      id: "ai-where-it-helps",
      heading: "Smart features that grow the basket.",
      cards: [
        {
          title: "Recommendations matched to each shopper.",
          body: "The store learns what each customer likes and shows more of it, the way a good shop assistant would.",
        },
        {
          title: "Search by photo.",
          body: "Customers find the product they saw, even when they cannot name it.",
        },
        {
          title: "Product descriptions written and translated automatically.",
          body: "A thousand products described well, in days instead of months.",
        },
        {
          title: "Stock forecasting.",
          body: "The system tells you what to reorder before you run out, and what to stop buying before it piles up.",
        },
        {
          title: "Prices and promotions that respond to demand.",
          body: "Margin protected on what sells, movement created on what does not.",
        },
        {
          title: "Abandoned cart recovery.",
          body: "The follow-up that brings shoppers back goes out automatically, at the moment it works best.",
        },
      ],
      closingLine:
        "Each one is optional. We recommend the ones your numbers say will pay off.",
    },
    {
      kind: "rich",
      id: "process",
      heading: "How a store build runs.",
      body: [
        "We start with your catalogue and your operations, because the store has to fit both. Then we recommend a platform with reasons attached, design it, build it, and launch it. The work does not stop at launch: the first months of real sales data are where the smart features get tuned, and where the store starts earning its keep.",
      ],
    },
    {
      kind: "rich",
      id: "proof",
      heading: "What a smarter store sells.",
      body: [
        "Bigger average orders, because the right products meet the right shopper. Fewer stockouts, because the reorder happened before the shelf went empty. And customers who come back, because the store remembered them and gave them a reason to.",
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
      heading: "Who we build stores for.",
      note: "Cards: Retail, Restaurants, Automotive, Media, Fitness & Beauty",
    },
    {
      kind: "faq",
      id: "faq",
      heading: "Asked before every store build.",
      items: [
        {
          question: "Shopify or custom: which do we need?",
          answer:
            "If your catalogue and selling model are straightforward, Shopify or WooCommerce gets you live in weeks and we will say so plainly. Custom earns its cost when your catalogue, pricing, or business model will not fit a template. The honest comparison is part of our first call, and we publish a full guide on it too.",
        },
        {
          question: "Can you connect the store to our physical shop?",
          answer:
            "Yes. Tills, website, and app share one stock count and one customer record, so you stop selling things online that the shop sold an hour ago.",
        },
        {
          question: "Which payment providers do you work with?",
          answer:
            "Paystack, Flutterwave, Monnify, and other regional gateways, set up properly with reconciliation in mind from day one.",
        },
        {
          question:
            "Can you migrate our existing store without losing sales history?",
          answer:
            "Yes. Products, customers, and order history move over, redirects protect your search rankings, and we time the switch for your quietest hours.",
        },
        {
          question: "What does an online store cost?",
          answer:
            "A Shopify or WooCommerce build costs a fraction of a custom platform, and we will tell you which your business actually needs before either number matters. The written scope carries the real figure, and our cost guide publishes honest ranges.",
        },
      ],
    },
    {
      kind: "cta-band",
      id: "cta-band",
      heading: "Your next sale should not depend on you being awake.",
      button: { label: "Plan my store", href: "/contact" },
    },
  ],
};
