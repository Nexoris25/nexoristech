/**
 * Home page content, transcribed verbatim from the approved Website Copy (Part 1, Home).
 * Dynamic [square bracket] blocks from the copy are modelled as `dynamic` sections sourced
 * from the CMS at render time, never rendered as literal text.
 */
import type { MarketingPage } from "../types.js";

export const home: MarketingPage = {
  meta: {
    slug: "/",
    routeClass: "home",
    title: "Software Development Company in Lagos | Nexoris Technologies",
    description:
      "We design and build websites, apps, dashboards, and custom business software for companies across Nigeria and abroad. Tell us the problem, and we will solve it.",
  },
  hero: {
    h1: "Software built around the way your business really works.",
    subline:
      "Nexoris Technologies designs and builds websites, web applications, mobile apps, and business systems for companies in Nigeria and abroad. Where AI can genuinely make a product better, we build it in. And everything we deliver belongs to you, completely.",
    primaryCta: { label: "Start a project", href: "/contact" },
    secondaryCta: { label: "Find the right service", href: "#solution-finder" },
    trustStrip:
      "Working with founders, executives, operations leaders, and public institutions.",
  },
  sections: [
    {
      kind: "cards",
      id: "pain",
      heading: "You already know where the time is going.",
      cards: [
        {
          body: "The retyping. Your team enters the same customer details into three different tools, every single day. Nobody planned it that way. It just grew, and now it quietly eats hours that should go into real work.",
        },
        {
          body: "The waiting. The report you need for Monday's decision arrives on Wednesday. By then the moment has passed, and you decided on instinct. Again.",
        },
        {
          body: "The silence. A customer sends a message at 9pm with money in hand and a simple question. Nobody is there to answer. By morning, they have bought from someone who was.",
        },
      ],
      closingLine: "These are solvable problems. Solving them is what we do.",
    },
    {
      kind: "dynamic",
      id: "solution-finder",
      heading:
        "Tell us what is going on. We will point you to the right service.",
      intro:
        "You do not need to know what an ERP is or whether you need a chatbot. Just answer five short questions about your business and what is frustrating you. Our assistant will match you to the right service, explain why in plain words, and you can take it from there. It takes about a minute.",
      note: "Solution Finder: five questions, instant recommendation",
      link: { label: "Find the right service", href: "#solution-finder" },
    },
    {
      kind: "cards",
      id: "services",
      heading: "Four ways we help.",
      cards: [
        {
          title: "Build new software.",
          body: "We design and build websites, apps, online stores, and custom systems around the way you work. Not the other way round.",
          links: [
            {
              label: "AI Product Development",
              href: "/ai-product-development",
            },
            { label: "AI E-Commerce", href: "/ai-ecommerce-development" },
            { label: "GovTech Platforms", href: "/govtech-platforms" },
            { label: "IoT Development", href: "/iot-development" },
          ],
        },
        {
          title: "Automate the busywork.",
          body: "We take the repetitive work off your team and answer your customers at any hour. Your people get their time back for work that needs judgement.",
          links: [
            {
              label: "Business Process Automation",
              href: "/business-process-automation",
            },
            {
              label: "AI Chatbots & Virtual Assistants",
              href: "/ai-chatbots-virtual-assistants",
            },
            {
              label: "AI & Systems Integration",
              href: "/ai-systems-integration",
            },
          ],
        },
        {
          title: "Understand your numbers.",
          body: "We turn your data into clear dashboards and forecasts you can act on. No more deciding this quarter with last quarter's numbers.",
          links: [
            {
              label: "Data Dashboards & Analytics",
              href: "/data-dashboards-predictive-analytics",
            },
            {
              label: "Data Infrastructure & AI Readiness",
              href: "/data-infrastructure-ai-readiness",
            },
          ],
        },
        {
          title: "Grow it and keep it running.",
          body: "We help people find you online and we look after your software long after launch. The product you paid for keeps getting better.",
          links: [
            { label: "AI Content, SEO & GEO", href: "/ai-seo-geo" },
            {
              label: "Managed Technology Operations",
              href: "/managed-technology-operations",
            },
          ],
        },
      ],
      footerLink: { label: "See everything we do", href: "#services" },
    },
    {
      kind: "steps",
      id: "process",
      heading: "How a project runs, from first call to handover.",
      intro:
        "Whether it is a single website or a full business platform, the process stays the same. Plan properly, design before building, and check the work at every stage.",
      steps: [
        {
          title: "Discovery and Planning.",
          body: "We agree on a clear plan, scope, and timeline before development begins.",
        },
        {
          title: "UX/UI Design.",
          body: "You see and approve the designs before we write serious code.",
        },
        {
          title: "Development.",
          body: "We build in stages and keep you updated throughout.",
        },
        {
          title: "Quality Assurance and Testing.",
          body: "Checked across browsers and devices before any stage is marked complete.",
        },
        {
          title: "Deployment and Handover.",
          body: "Documentation, training where needed, and your team able to run things on their own.",
        },
        {
          title: "Ongoing Support.",
          body: "Maintenance plans that cover updates, monitoring, and improvements.",
        },
      ],
      link: { label: "See the full approach", href: "/how-we-work" },
    },
    {
      kind: "dynamic",
      id: "industries",
      heading: "Twenty industries we build for.",
      intro:
        "Good engineering travels, but every industry has its own problems, rules, and rhythms. We have built for twenty of them, and each page below speaks your language, not ours.",
      note: "Filterable grid of 20 industry tiles from Strapi",
    },
    {
      kind: "dynamic",
      id: "proof",
      heading: "Work our clients can put a number on.",
      intro:
        "We agree the outcome before we start, then we track the work against it. Here is some of what that looks like.",
      note: "Metrics band: three verified outcome figures from Strapi, shown only when real project data exists. Two featured case study cards from Strapi.",
      link: { label: "See the work", href: "/case-studies" },
    },
    {
      kind: "cards",
      id: "why",
      heading: "What working with us is like.",
      cards: [
        {
          title: "A written scope before any work begins.",
          body: "Every project starts with a written scope, timeline, and cost. There is no confusion about what will be delivered and when, and no surprise invoices later.",
        },
        {
          title: "Direct access to the people building your product.",
          body: "Nexoris Technologies is led by its founder, who works directly on every project. You talk to the people doing the work, not an account layer in between.",
        },
        {
          title: "We know how Nigerian businesses really operate.",
          body: "Local payment systems, patchy connectivity, regulatory requirements, and the way decisions actually get made here. We build for the real environment, not an imagined one.",
        },
        {
          title: "Full ownership at handover.",
          body: "All source code, designs, and project files are handed over to you at the end of the project. Nothing is held back.",
        },
      ],
    },
    {
      kind: "rich",
      id: "ai-approach",
      heading: "We add AI where it helps. We skip it where it does not.",
      body: [
        "Not every problem needs AI, and we will tell you when yours does not. But when it genuinely helps, like a chatbot that answers customers at midnight or a forecast that warns you before stock runs out, we build it in properly from the start.",
      ],
    },
    {
      kind: "dynamic",
      id: "testimonials",
      heading: "What clients say.",
      note: "Carousel: 3 to 5 client quotes from Strapi, each with name, role, and company",
    },
    {
      kind: "dynamic",
      id: "insights",
      heading: "Recent thinking from the team.",
      note: "Latest three Insights articles from Strapi",
    },
    {
      kind: "cta-band",
      id: "cta-band",
      heading: "Tell us what you are trying to achieve.",
      body: "We will reply within one business day with a short call, a suggested approach, and a realistic sense of timeline and cost. No obligation on your part.",
      button: { label: "Start a project", href: "/contact" },
    },
  ],
};
