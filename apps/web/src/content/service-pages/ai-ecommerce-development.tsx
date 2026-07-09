/**
 * AI E-Commerce service page, transcribed from the approved design handoff
 * (ai-ecommerce-development.html). The hero uses the interactive smart-storefront widget. Copy,
 * icons, and FAQ match the handoff; the "smart features" selector is transcribed as the AI feature
 * cards, and proof states honest "smarter store" outcomes without fabricated figures. Consumed by
 * the ServiceView template.
 */
import type { ServiceContent } from "../../components/service/ServiceView.js";

export const aiEcommerceDevelopment: ServiceContent = {
  breadcrumb: "AI E-Commerce",
  hero: {
    kicker: "Build new software · Selling online",
    h1: "An online store that keeps selling after you close for the day.",
    lede: "We build online stores and marketplaces: custom platforms when your catalogue is complex, Shopify or WooCommerce when you need to launch quickly, and honest advice about which one you actually need. Smart features like recommendations and stock forecasting are there from the start, not promised for later.",
    primaryCta: { label: "Plan my store", href: "/contact" },
    secondaryCta: { label: "Find the right service", href: "/#finder" },
    stats: [],
    media: {
      src: "/services/ecommerce-hero.webp",
      alt: "A shopper comparing products and paying by card on an online store",
      chipTitle: "Built to keep selling",
      chipSub: "Storefronts that work day and night",
    },
  },
  problem: {
    kicker: "Where the sales go",
    h2: "Your store is losing sales in places you cannot see.",
    quotes: [
      { text: "People fill their carts and vanish at checkout. We never find out why.", tag: "At checkout" },
      { text: "Our bestseller was out of stock for nine days. Nine days.", tag: "Out of stock" },
      { text: "We pay for ads, customers buy once, and we never see them again.", tag: "One and done" },
    ],
    close: (
      <>
        None of these are mysteries. They are measurable leaks, and{" "}
        <b>a properly built store closes them one by one.</b>
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
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="M3 9h18M8 13h8M8 16h5" />
          </>
        ),
        title: "Custom online stores and marketplaces",
        body: "For complex catalogues, multiple sellers, or business models that off-the-shelf platforms cannot hold.",
      },
      {
        icon: (
          <>
            <path d="M6 8h12l-1 12a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1L6 8z" />
            <path d="M9 8V6a3 3 0 0 1 6 0v2" />
          </>
        ),
        title: "Shopify and WooCommerce stores",
        body: "Design, development, and migration when speed to launch matters more than custom machinery. We tell you honestly when this is the right answer.",
      },
      {
        icon: <path d="M3 3h18v6H3zM3 9v12h18V9M9 13h6" />,
        title: "Wholesale portals",
        body: "Business customers get their own prices, credit terms, and ordering, without phone calls and spreadsheets.",
      },
      {
        icon: (
          <>
            <circle cx="6" cy="7" r="2.5" />
            <circle cx="18" cy="7" r="2.5" />
            <circle cx="12" cy="17" r="2.5" />
            <path d="M8 8l3 7M16 8l-3 7" />
          </>
        ),
        title: "Connected channels",
        body: "Your website, your app, and your physical shop tills sharing one stock count and one customer record.",
      },
      {
        icon: (
          <>
            <path d="M21 12a9 9 0 1 1-3-6.7" />
            <path d="M21 4v4h-4" />
          </>
        ),
        title: "Subscriptions and recurring billing",
        body: "For products people buy on a rhythm, the store remembers so the customer does not have to.",
      },
      {
        icon: (
          <>
            <rect x="2" y="6" width="20" height="12" rx="2" />
            <path d="M2 10h20M6 14h4" />
          </>
        ),
        title: "Payments and reconciliation",
        body: "Paystack, Flutterwave, and Monnify set up properly, so what hits your account always matches what the store recorded.",
      },
    ],
  },
  ai: {
    kicker: "Smart features, optional by design",
    h2: "Smart features that grow the basket.",
    intro:
      "Each one is optional. We recommend the ones your numbers say will pay off, and leave out the ones you will not use.",
    feats: [
      {
        icon: (
          <>
            <circle cx="12" cy="8" r="3.4" />
            <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
          </>
        ),
        title: "Recommendations matched to each shopper",
        body: "The store learns what each customer likes and shows more of it, the way a good shop assistant would.",
      },
      {
        icon: (
          <>
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <circle cx="9" cy="11" r="2" />
            <path d="M3 17l5-4 4 3 3-2 6 5" />
          </>
        ),
        title: "Search by photo",
        body: "Customers find the product they saw, even when they cannot name it.",
      },
      {
        icon: <path d="M4 7h16M4 12h16M4 17h10" />,
        title: "Auto descriptions",
        body: "A thousand products described well, in days instead of months, and translated automatically.",
      },
      {
        icon: (
          <>
            <path d="M3 17l6-6 4 4 8-8" />
            <path d="M21 7v5h-5" />
          </>
        ),
        title: "Stock forecasting",
        body: "The system tells you what to reorder before you run out, and what to stop buying before it piles up.",
      },
      {
        icon: <path d="M12 2v20M7 6h7a3 3 0 0 1 0 6H8a3 3 0 0 0 0 6h8" />,
        title: "Smart pricing",
        body: "Margin protected on what sells, movement created on what does not.",
      },
      {
        icon: (
          <>
            <path d="M6 6h15l-1.5 9h-12z" />
            <circle cx="9" cy="20" r="1.5" />
            <circle cx="18" cy="20" r="1.5" />
          </>
        ),
        title: "Abandoned cart recovery",
        body: "The follow-up that brings shoppers back goes out automatically, at the moment it works best.",
      },
    ],
    foot: "We turn on the features your numbers support, and leave out the ones you will not use.",
  },
  process: {
    h2: "The store has to fit your catalogue and your operations.",
    steps: [
      {
        title: "Catalogue & operations",
        body: "We start with what you sell and how you run, because the store has to fit both.",
      },
      {
        title: "Platform with reasons",
        body: "Custom, Shopify, or WooCommerce, recommended with the trade-offs spelled out.",
      },
      {
        title: "Design, build, launch",
        body: "Built around your shoppers and your team, then shipped.",
      },
      {
        title: "Tune on real sales",
        body: "The smart features get tuned on real data, where the payoff shows up.",
      },
    ],
    note: (
      <>
        We recommend a platform with reasons attached, then design, build, and launch it.{" "}
        <b>The first months of real sales data are where the store starts earning its keep.</b>
      </>
    ),
  },
  proof: {
    kicker: "What a smarter store sells",
    h2: "Bigger baskets, fewer stockouts, customers who come back.",
    lede: "Nothing here is a magic number. It is what a well-built store does once the smart features are tuned on your own sales.",
    cards: [
      {
        tag: "A smarter store",
        title: "Bigger average orders, because the right products meet the right shopper.",
      },
      {
        tag: "A smarter store",
        title: "Fewer stockouts, because the reorder happened before the shelf went empty.",
      },
      {
        tag: "A smarter store",
        title: "Customers who come back, because the store remembered them and gave them a reason to.",
      },
    ],
  },
  industryLinks: {
    kicker: "Industries",
    h2: "Who we build stores for.",
    lede: "Wherever people buy online or on a rhythm, a store built around your catalogue pays back fastest.",
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
        href: "/restaurant-software",
        icon: <path d="M5 3v7a2 2 0 0 0 4 0V3M7 12v9M17 3c-1.6 1-2.5 3-2.5 6V12H17v9" />,
        title: "Restaurants & QSR",
        body: "Orders, kitchens, and delivery that move at rush-hour pace.",
      },
      {
        href: "/fitness-wellness-software",
        icon: <path d="M3 9v6M6 8v8M18 8v8M21 9v6M6 12h12" />,
        title: "Fitness, Beauty & Wellness",
        body: "Bookings, memberships, and clients managed in one place.",
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
      {
        href: "/automotive-software",
        icon: (
          <>
            <path d="M3 13l2-5a2 2 0 0 1 1.9-1.4h10.2A2 2 0 0 1 19 8l2 5v5H3z" />
            <circle cx="7.5" cy="18" r="1.4" />
            <circle cx="16.5" cy="18" r="1.4" />
          </>
        ),
        title: "Automotive",
        body: "Workshops, dealerships, and service bookings organised end to end.",
      },
      {
        href: "/events-software",
        icon: (
          <>
            <path d="M4 7h16v3a2 2 0 0 0 0 4v3H4v-3a2 2 0 0 0 0-4z" />
            <path d="M14 7v10" />
          </>
        ),
        title: "Events & Weddings",
        body: "Bookings, guests, and timelines coordinated to the minute.",
      },
    ],
  },
  faq: {
    kicker: "Questions",
    h2: "Asked before every store build.",
    lede: "Shopify or custom, payments, migration, and what it actually costs.",
    items: [
      {
        q: "Shopify or custom: which do we need?",
        a: "If your catalogue and selling model are straightforward, Shopify or WooCommerce gets you live in weeks and we will say so plainly. Custom earns its cost when your catalogue, pricing, or business model will not fit a template. The honest comparison is part of our first call, and we publish a full guide on it too.",
      },
      {
        q: "Can you connect the store to our physical shop?",
        a: "Yes. Tills, website, and app share one stock count and one customer record, so you stop selling things online that the shop sold an hour ago.",
      },
      {
        q: "Which payment providers do you work with?",
        a: "Paystack, Flutterwave, Monnify, and other regional gateways, set up properly with reconciliation in mind from day one.",
      },
      {
        q: "Can you migrate our existing store without losing sales history?",
        a: "Yes. Products, customers, and order history move over, redirects protect your search rankings, and we time the switch for your quietest hours.",
      },
      {
        q: "What does an online store cost?",
        a: "A Shopify or WooCommerce build costs a fraction of a custom platform, and we will tell you which your business actually needs before either number matters. The written scope carries the real figure, and our cost guide publishes honest ranges.",
      },
    ],
  },
  cta: {
    h2: "Your next sale should not depend on you being awake.",
    body: "Tell us what you sell and how you sell it. We will reply within one business day with the platform we would recommend and why.",
    button: { label: "Plan my store", href: "/contact" },
  },
};
