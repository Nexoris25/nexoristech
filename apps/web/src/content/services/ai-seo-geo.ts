/**
 * AI Content, SEO & GEO service page, transcribed verbatim from the approved Website Copy
 * (Part 2). This service is AI by nature, so the AI is the service itself rather than an optional
 * block (PRD 12).
 */
import type { MarketingPage } from "../types.js";

export const aiSeoGeo: MarketingPage = {
  meta: {
    slug: "/ai-seo-geo",
    routeClass: "service",
    title: "SEO & AI Search Optimisation | Nexoris Technologies",
    description:
      "Content and SEO built for both Google and AI tools like ChatGPT and Perplexity. Get found where your customers now ask, and track every mention of your brand.",
  },
  hero: {
    h1: "When someone asks Google or ChatGPT about your industry, be the answer.",
    subline:
      "More of your customers now ask AI tools before they ask Google. We build content strategies that earn visibility on both, and we track where your brand shows up so you are never guessing.",
    primaryCta: { label: "Request a visibility audit", href: "/contact" },
    secondaryCta: { label: "Find the right service", href: "#solution-finder" },
  },
  sections: [
    {
      kind: "cards",
      id: "pain",
      heading:
        "Your customers are asking AI about you right now. What is it saying?",
      cards: [
        {
          body: "A customer told us ChatGPT recommended our competitor. By name.",
        },
        {
          body: "Our rankings look fine, but the traffic keeps sliding anyway.",
        },
        { body: "We publish and publish, and nothing seems to land anywhere." },
      ],
      closingLine:
        "The way people find businesses has changed faster than most marketing has. Catching up is very doable. Staying invisible is the expensive option.",
    },
    {
      kind: "cards",
      id: "scope",
      heading: "What the work covers.",
      cards: [
        {
          title: "A content audit and gap analysis.",
          body: "What you have, what your competitors rank and get cited for, and exactly where the gaps are.",
        },
        {
          title: "A content plan and production.",
          body: "Strategy and writing aimed at the questions your buyers actually ask, on Google and inside AI tools.",
        },
        {
          title: "Technical SEO and site structure.",
          body: "The unglamorous foundations: speed, structure, and markup that let everything else work.",
        },
        {
          title: "Generative Engine Optimisation, known as GEO.",
          body: "Content shaped and marked up so AI tools like ChatGPT, Perplexity, and Google's AI Overviews can find it, trust it, and cite it.",
        },
        {
          title: "Your content system, set up properly.",
          body: "Strapi, WordPress, Sanity, or custom, so your team can publish at scale without calling a developer.",
        },
        {
          title: "A clear monthly report.",
          body: "What moved, why, and what we are doing next, in plain language.",
        },
      ],
    },
    {
      kind: "rich",
      id: "how-we-work-it",
      heading: "The tools behind the strategy.",
      body: [
        "Drafting is assisted by AI and controlled by your brand voice, with a person editing everything that ships. Internal linking and topic grouping happen automatically, so your content strengthens itself as it grows. Structured data tells machines exactly what each page is, which is what makes citations possible. And your brand mentions get tracked across the AI tools, so visibility becomes a number we report rather than a feeling.",
      ],
    },
    {
      kind: "rich",
      id: "process",
      heading: "How an engagement runs.",
      body: [
        "The audit comes first and tells you where you stand on Google and inside the AI tools, in plain words. Then the strategy, then a steady production rhythm, because search visibility is built by consistency rather than bursts. Every month you get a report that says what moved, what we learned, and what happens next. And we will tell you the honest part on day one: this work compounds over months, not days.",
      ],
    },
    {
      kind: "rich",
      id: "proof",
      heading: "We practise this on our own site.",
      body: [
        "This website is built exactly the way we advise clients: full structured data, content shaped for citation, and the questions buyers ask answered directly on the page. We track where Nexoris Technologies appears across ChatGPT, Perplexity, and Google's AI Overviews every quarter, and we publish the results here as they come in. If we cannot do it for ourselves, you should not pay us to do it for you.",
      ],
    },
    {
      kind: "dynamic",
      id: "proof-results",
      note: "Tracked visibility results from Strapi, updated quarterly",
    },
    {
      kind: "dynamic",
      id: "industries-links",
      heading: "Who this serves best.",
      note: "Cards: Real Estate, Hospitality, Professional Services, Media, Events",
    },
    {
      kind: "faq",
      id: "faq",
      heading: "Asked before every visibility project.",
      items: [
        {
          question: "How long before we see results?",
          answer:
            "Honestly: technical fixes can move things within weeks, content typically compounds over three to six months, and authority builds beyond that. Anyone promising page one in thirty days is describing a trick, not a strategy.",
        },
        {
          question: "What exactly is GEO?",
          answer:
            "Generative Engine Optimisation: making your content findable, trustworthy, and citable by AI tools like ChatGPT and Perplexity, which now answer a growing share of the questions your buyers used to type into Google. It overlaps with SEO and goes beyond it.",
        },
        {
          question: "Is AI-written content not penalised?",
          answer:
            "Lazy content is penalised, however it was written. We use AI to draft and people to edit, and everything ships in your voice with your expertise in it. Quality is the standard, and the tool does not change the standard.",
        },
        {
          question: "Can you work with our existing website?",
          answer:
            "Usually yes. The audit tells us whether your current platform can support the work or whether structural fixes come first, and we tell you that before any content money is spent.",
        },
        {
          question: "How do you measure success?",
          answer:
            "Rankings and traffic, but also the newer numbers: how often you appear in AI Overviews, how often AI tools cite you for your target questions, and most importantly, the enquiries all of it produces. The monthly report shows all of it plainly.",
        },
      ],
    },
    {
      kind: "cta-band",
      id: "cta-band",
      heading:
        "Find out what the machines are saying about you. The audit will show you exactly.",
      button: { label: "Request a visibility audit", href: "/contact" },
    },
  ],
};
