/**
 * Automotive industry page, transcribed verbatim from the approved Website Copy (Part 3).
 */
import type { MarketingPage } from "../types.js";

export const automotiveSoftware: MarketingPage = {
  meta: {
    slug: "/automotive-software",
    routeClass: "industry",
    title: "Dealership & Workshop Software | Nexoris Technologies",
    description:
      "Dealer management systems, workshop portals, and parts inventory for dealerships and service centres. Grow after-sales revenue and keep customers for years.",
  },
  hero: {
    h1: "Every vehicle, every job, every part, in one system that remembers.",
    subline:
      "We build dealer management systems, workshop portals, and parts inventory tools for dealerships, service centres, and parts distributors. Service history follows every vehicle, parts arrive before they run out, and the customer who bought from you three years ago hears from you at exactly the right time.",
    primaryCta: { label: "Talk to us about your business", href: "/contact" },
    secondaryCta: { label: "Find the right service", href: "#solution-finder" },
  },
  sections: [
    {
      kind: "cards",
      id: "pain",
      heading:
        "After-sales is where the profit lives. Most operations leave it on the table.",
      cards: [
        {
          body: "The customer bought the car here three years ago. We have not spoken since.",
        },
        {
          body: "Service appointments live in a book at the desk, and the bays are half busy and half idle.",
        },
        {
          body: "The fast-moving part is out of stock again. The slow ones fill the shelf.",
        },
        {
          body: "What has been done to this vehicle before? Depends who you ask.",
        },
      ],
      closingLine:
        "A car sale happens once. Service, parts, and the next sale happen for years, but only for the operation whose system remembers. The one below remembers everything.",
    },
    {
      kind: "cards",
      id: "solutions",
      heading: "What we build for automotive.",
      cards: [
        {
          title: "Dealer management systems.",
          body: "Sales, stock, customers, and after-sales in one system instead of four books.",
        },
        {
          title: "Workshop and service bay portals.",
          body: "Jobs scheduled, tracked, and invoiced, with every bay's day visible at a glance.",
        },
        {
          title: "Parts inventory.",
          body: "What is on the shelf, what is moving, and what to reorder, by the numbers.",
        },
        {
          title: "Customer apps.",
          body: "Owners book service, see their vehicle's full history, and get reminders that bring them back.",
        },
        {
          title: "Warranty claim portals.",
          body: "Claims documented and submitted clean the first time, which is most of the battle.",
        },
        {
          title: "Online stores for tyres and parts.",
          body: "The counter extended to the whole city, open all night.",
        },
      ],
    },
    {
      kind: "cards",
      id: "ai-where-it-helps",
      heading: "Where AI can drive after-sales revenue.",
      cards: [
        {
          title: "Smarter service scheduling.",
          body: "The bays packed properly, with the right jobs in the right order.",
        },
        {
          title: "Parts demand prediction.",
          body: "Stock follows what your vehicles will actually need, so the fast mover is on the shelf and the dead stock is not.",
        },
        {
          title: "Diagnostic suggestions from the customer's description.",
          body: '"It makes a noise when I brake" becomes a head start for the technician.',
        },
        {
          title: "Service reminders at the right moment.",
          body: "Based on the actual vehicle and its actual history, not a blanket SMS.",
        },
        {
          title: "Customers ranked by lifetime value.",
          body: "The relationships worth the most get the attention they deserve.",
        },
        {
          title: "Damage estimates from photos.",
          body: "A first quote in minutes from pictures the customer sends.",
        },
      ],
      closingLine:
        "Your technicians make the final call. The system just makes them faster.",
    },
    {
      kind: "rich",
      id: "outcomes",
      heading: "What changes across the business.",
      body: [
        "Service bays run fuller because scheduling got smart and reminders bring vehicles back. After-sales revenue grows on customers you already won. Less cash sits in slow parts, more customers stay for the second car, and every vehicle carries a complete history that makes each job faster and each sale easier.",
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
      heading: "Asked by every dealer principal and workshop owner we meet.",
      items: [
        {
          question: "Can it handle both our dealership and our workshops?",
          answer:
            "Yes, in one system. The sale creates the customer and vehicle record, and service, parts, and the eventual next sale all build on it.",
        },
        {
          question: "Will technicians and service advisors actually use it?",
          answer:
            "Yes, because it is built for the service lane: quick job cards, photos from a phone, and status the advisor can read to the customer without walking to the bay.",
        },
        {
          question: "Can customers really see their own service history?",
          answer:
            "Yes, in their app: every job, every part, every invoice. It builds trust, and it quietly raises the resale value of servicing with you.",
        },
        {
          question:
            "How does the parts prediction work for our mix of vehicles?",
          answer:
            "It learns from your own service history and vehicle population, so the forecast reflects what actually rolls through your gates, not a generic market.",
        },
        {
          question: "We also sell parts to other workshops. Does that fit?",
          answer:
            "Yes. Trade customers get their own portal and pricing, retail gets the online store, and one stock count serves the counter, the workshop, and the web.",
        },
      ],
    },
    {
      kind: "cta-band",
      id: "cta-band",
      heading:
        "The sale was the introduction. The system we build turns it into a relationship that pays for years.",
      button: { label: "Talk to us about your business", href: "/contact" },
    },
  ],
};
