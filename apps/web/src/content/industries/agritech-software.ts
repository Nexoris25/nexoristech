/**
 * Agriculture & Agritech industry page, transcribed verbatim from the approved Website Copy
 * (Part 3).
 */
import type { MarketingPage } from "../types.js";

export const agritechSoftware: MarketingPage = {
  meta: {
    slug: "/agritech-software",
    routeClass: "industry",
    title: "Agritech & Farm Software in Nigeria | Nexoris Technologies",
    description:
      "Farm management systems, outgrower platforms, and farm marketplaces, with crop disease detection from a phone photo and advice in the farmer's own language.",
  },
  hero: {
    h1: "Farm with data on your side, not just the weather.",
    subline:
      "We build farm management systems, outgrower platforms, and agricultural marketplaces for commercial farms, cooperatives, and agritech companies. Disease gets spotted from a phone photo, yields become steady enough to plan around, and farmers get advice in the language they actually speak.",
    primaryCta: { label: "Talk to us about your operation", href: "/contact" },
    secondaryCta: { label: "Find the right service", href: "#solution-finder" },
  },
  sections: [
    {
      kind: "cards",
      id: "pain",
      heading:
        "Farming has always carried risk. Most of it no longer has to be a surprise.",
      cards: [
        {
          body: "The disease was in the field for two weeks before anyone recognised it. By then it had spread.",
        },
        {
          body: "We sell at whatever price the middleman offers, because we cannot see the market.",
        },
        {
          body: "The export buyer wants traceability records we simply do not have.",
        },
        {
          body: "Managing three thousand smallholders means paper forms, motorbikes, and prayers.",
        },
      ],
      closingLine:
        "The weather will always be the weather. Everything else on that list is an information problem, and information problems are exactly what software solves.",
    },
    {
      kind: "cards",
      id: "solutions",
      heading: "What we build for agriculture.",
      cards: [
        {
          title: "Farm management systems.",
          body: "Fields, crops, inputs, activities, and costs recorded properly, so the farm runs on records instead of memory.",
        },
        {
          title: "Outgrower and scheme management.",
          body: "Thousands of smallholders registered, supported, and tracked, with inputs and offtake reconciled per farmer.",
        },
        {
          title: "Agricultural marketplaces.",
          body: "Producers and buyers meeting directly, with prices visible to both sides.",
        },
        {
          title: "Input credit and pay-later tools.",
          body: "Inputs distributed on credit with repayment tracked through the harvest cycle.",
        },
        {
          title: "Traceability for export.",
          body: "Every batch carrying its history from field to container, in the format buyers ask for.",
        },
        {
          title: "Field agent apps that work offline.",
          body: "Data captured in the field, synced when the network returns, because rural coverage is what it is.",
        },
        {
          title: "Weather and advisory portals.",
          body: "Forecasts and guidance reaching farmers where they are, in the language they use.",
        },
      ],
    },
    {
      kind: "cards",
      id: "ai-where-it-helps",
      heading: "Where AI can work the field.",
      cards: [
        {
          title: "Crop disease spotted from a phone photo.",
          body: "A farmer photographs the leaf and gets an identification and what to do about it, in minutes.",
        },
        {
          title: "Soil sensor readings turned into advice.",
          body: "Moisture and nutrient data become plain instructions, not graphs.",
        },
        {
          title: "Yield forecasts.",
          body: "What the season is likely to deliver, early enough to plan sales and logistics around it.",
        },
        {
          title: "Alerts triggered by weather.",
          body: "The warning arrives before the event, with the recommended action attached.",
        },
        {
          title: "Credit scoring for farmers without bank records.",
          body: "Farming history and behaviour data open credit to farmers the banks cannot see.",
        },
        {
          title: "Voice advice in local languages.",
          body: "Guidance delivered by voice for farmers who prefer to listen rather than read.",
        },
      ],
      closingLine:
        "Built for real field conditions, including the days the network disappears.",
    },
    {
      kind: "rich",
      id: "outcomes",
      heading: "What changes by harvest.",
      body: [
        "Yields rise and steady because problems get caught early and advice arrives on time. Prices improve because the market is visible and the middleman is optional. Less is lost after harvest, more farmers participate fully in the scheme, and the traceability records that export buyers demand exist as a matter of course.",
      ],
    },
    {
      kind: "dynamic",
      id: "services-links",
      heading: "Built with these services.",
      note: "Cards: AI Product Development, IoT Development, AI E-Commerce, Dashboards & Analytics, Managed Technology Operations",
    },
    {
      kind: "rich",
      id: "proof",
      heading: "From operations like yours.",
    },
    {
      kind: "dynamic",
      id: "proof-cards",
      note: "Case study cards from Strapi, filtered by industry tag, plus testimonial",
    },
    {
      kind: "faq",
      id: "faq",
      heading: "Asked by every farm operator and programme lead we meet.",
      items: [
        {
          question: "Does it work where there is no network coverage?",
          answer:
            "Yes. The field apps capture everything offline and sync when coverage returns. That is a founding requirement, not an afterthought, because rural Nigeria is where this software lives.",
        },
        {
          question: "Can smallholder farmers actually use it?",
          answer:
            "The farmer-facing parts are built for basic smartphones, low literacy, and local languages, with voice where it helps. The complexity lives on the management side, where it belongs.",
        },
        {
          question: "How accurate is the disease detection?",
          answer:
            "Good enough to be genuinely useful as a first identification, and it always comes with guidance to confirm with an extension officer for serious cases. We are honest about what a photo can and cannot diagnose.",
        },
        {
          question:
            "Can it manage input loans and recovery across an outgrower scheme?",
          answer:
            "Yes. Inputs issued, costs tracked per farmer, and recovery reconciled against deliveries at offtake. The scheme finally balances on data rather than disputes.",
        },
        {
          question: "What does the export traceability actually produce?",
          answer:
            "A record per batch: farm, field, inputs, dates, and handling, exportable in the formats buyers and certifiers ask for. The audit that took weeks becomes a download.",
        },
      ],
    },
    {
      kind: "cta-band",
      id: "cta-band",
      heading:
        "The weather will stay unpredictable. Your operation does not have to.",
      button: { label: "Talk to us about your operation", href: "/contact" },
    },
  ],
};
