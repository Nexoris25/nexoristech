/**
 * How We Work page content, transcribed verbatim from the approved Website Copy
 * (Part 1, How We Work).
 */
import type { MarketingPage } from "../types.js";

export const howWeWork: MarketingPage = {
  meta: {
    slug: "/how-we-work",
    routeClass: "how-we-work",
    title: "How We Work | Nexoris Technologies",
    description:
      "Our six-stage delivery process, from discovery and design through to handover and support. Written scope, honest timelines, and full ownership of the work.",
  },
  hero: {
    h1: "Plan properly. Design before building. Check the work at every stage.",
    subline:
      "Whether the project is a single website or a full business platform, our process stays the same. We take time to understand the problem, design the solution carefully, and build software that is reliable, easy to maintain, and fully owned by you at the end.",
    primaryCta: { label: "Book a scoping call", href: "/contact" },
    secondaryCta: {
      label: "Download the service catalogue",
      href: "#service-catalogue",
    },
  },
  sections: [
    {
      kind: "steps",
      id: "stages",
      heading: "The six stages of every project.",
      steps: [
        {
          title: "Discovery and Planning.",
          body: "We start by understanding the business, its users, and any constraints. We ask a lot of questions, and we listen more than we talk. This stage produces a clear plan, scope, and timeline before development begins, so both sides know exactly what is being built, by when, and for how much.",
        },
        {
          title: "UX/UI Design.",
          body: "We create wireframes and full designs and have them reviewed with you before development starts. You see the product on screen and approve it before serious engineering money is spent. Changing a design costs little. Changing built software costs a lot. We do the changing here.",
        },
        {
          title: "Development.",
          body: "We build the product in stages using modern tools, and we keep you updated on progress throughout. You will never go weeks wondering what is happening. If something shifts, you hear it from us first, with options.",
        },
        {
          title: "Quality Assurance and Testing.",
          body: "We test across browsers and devices, and we check performance before any stage is marked complete. The product has to work for your real users on their real phones and connections, not just on our machines.",
        },
        {
          title: "Deployment and Handover.",
          body: "We deploy the finished product, provide documentation, and train your team where needed, so they can run the platform on their own. All source code, designs, and project files are handed over. Nothing is held back.",
        },
        {
          title: "Ongoing Support.",
          body: "We offer maintenance plans that cover updates, monitoring, and small improvements after launch. Most clients stay with us on one, because software that nobody maintains slowly becomes a problem.",
        },
      ],
    },
    {
      kind: "rich",
      id: "expectations",
      heading: "What you can hold us to.",
      body: [
        "A written scope, timeline, and cost before work begins. Straight answers when something changes, even when it is not what you expected to hear. Direct access to the people building your product. And at the end, all source code, designs, and project files handed over to you. Nothing is held back, and there is no quiet dependency designed to keep you paying.",
      ],
    },
    {
      kind: "cards",
      id: "models",
      heading: "Three ways to work with us.",
      cards: [
        {
          title: "A project with a fixed written scope.",
          body: "Best when you know what you need and want a clear price and date for it. We scope it, agree it in writing, and deliver it in stages you can see.",
        },
        {
          title: "An ongoing product partnership.",
          body: "Best when you are building something that will keep evolving, like a startup product or a growing platform. We work as your technical team over time, planning and shipping in regular cycles.",
        },
        {
          title: "A managed operations plan.",
          body: "Best after launch. We monitor, update, support, and improve your platform on a monthly plan, so it keeps earning instead of going stale.",
        },
      ],
    },
    {
      kind: "cards",
      id: "icp",
      heading: "Who we serve best.",
      cards: [
        {
          title: "Growing businesses of 50 to 1,000 staff.",
          body: "You have outgrown spreadsheets, informal processes, and off-the-shelf tools that almost fit. You need custom systems, dashboards, or apps for your team and customers, built around how you actually operate.",
        },
        {
          title: "Funded startups.",
          body: "You have raised money and need a senior technical partner to build or rebuild your product, add the right intelligent features, and get the system ready for more users. We move at startup speed without startup shortcuts.",
        },
        {
          title: "Larger companies modernising old systems.",
          body: "You have legacy platforms that work but hold you back. We connect them, extend them, or replace them in stages, without stopping the business while we do it.",
        },
        {
          title: "Public sector and development organisations.",
          body: "You are building citizen services, revenue systems, or programme platforms, and you carry procurement and compliance requirements most vendors underestimate. We understand that world and design for it from the start.",
        },
      ],
    },
    {
      kind: "faq",
      id: "faq",
      heading: "Questions people ask before they hire us.",
      items: [
        {
          question: "How long does a typical project take?",
          answer:
            "A business website usually takes four to eight weeks. A custom system or app typically runs three to six months, delivered in stages so you see working software early. We give you a real timeline in the written scope, and we treat it as a commitment.",
        },
        {
          question: "What does a project cost?",
          answer:
            "It depends on what we are building, and we will not pretend otherwise. What we promise is a clear written cost before work begins, honest ranges on our cost guides, and no surprise invoices. The scoping call gives you a realistic figure for your specific situation.",
        },
        {
          question: "Who owns the work at the end?",
          answer:
            "You do, completely. All source code, designs, documentation, and project files are handed over at the end of the project. Nothing is held back.",
        },
        {
          question: "How do you handle our data?",
          answer:
            "In line with the NDPR. We agree data handling rules in the scope, we limit access to the people who need it, and we are happy to sign an NDA before you share anything sensitive.",
        },
        {
          question: "What happens when the scope changes?",
          answer:
            "We tell you what the change means for timeline and cost before we do anything, in writing. You decide. Scope creep without a conversation is how projects go bad, so we simply do not allow it.",
        },
        {
          question: "What if you think our idea will not work?",
          answer:
            "We will tell you, with reasons, before you spend money on it. We have talked clients out of projects before. It is part of why they come back.",
        },
        {
          question: "Do you work with businesses outside Lagos?",
          answer:
            "Yes. We work with clients across Nigeria and abroad. The process runs the same way remotely, with regular calls and demos at every stage.",
        },
      ],
    },
    {
      kind: "cta-band",
      id: "cta-band",
      heading:
        "The first conversation costs nothing and usually clears things up.",
      body: "Tell us what you are trying to achieve. We will come back with a suggested approach and honest numbers.",
      button: { label: "Book a scoping call", href: "/contact" },
    },
  ],
};
