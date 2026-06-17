/**
 * About page content, transcribed verbatim from the approved Website Copy (Part 1, About).
 */
import type { MarketingPage } from "../types.js";

export const about: MarketingPage = {
  meta: {
    slug: "/about",
    routeClass: "about",
    title: "About Us | Nexoris Technologies",
    description:
      "Nexoris Technologies is a Lagos software company founded by Chinedu Nwogu. See how we work, what we truly value, and why most clients stay with us after launch.",
  },
  hero: {
    h1: "We build software the way we would want it built for us.",
    subline:
      "Nexoris Technologies Ltd is a Lagos-based company that designs and builds custom software for businesses in Nigeria and abroad. Every product we ship is held to a simple standard: would we be comfortable using it ourselves?",
    primaryCta: { label: "Work with us", href: "/contact" },
    secondaryCta: { label: "See how we work", href: "/how-we-work" },
  },
  sections: [
    {
      kind: "rich",
      id: "story",
      heading: "Why Nexoris Technologies exists.",
      body: [
        "Too much business software forces people to work around it. Staff keep a spreadsheet on the side because the system cannot do what they need. Managers wait days for numbers the business already has. Owners pay for tools the team quietly stopped using months ago.",
        "We started Nexoris Technologies to do the opposite. We begin with the problem and the people, and only then choose the technology. We take time to understand how your business actually runs, design the solution carefully, and build software that is reliable, easy to maintain, and fully owned by you at the end.",
        "The company is founded and led by Chinedu Nwogu, who works directly on every project from planning through to delivery. Our team combines modern software development practices with a clear understanding of the Nigerian business environment, including compliance requirements, local payment systems, and the way businesses here operate day to day. The result is software that performs well and that people can use without difficulty.",
      ],
    },
    {
      kind: "cards",
      id: "mission-vision",
      heading: "What we are building toward.",
      cards: [
        {
          title: "Our Mission.",
          body: "To design and build reliable software that helps businesses in Nigeria and across Africa run more efficiently, reach more customers, and grow with confidence.",
        },
        {
          title: "Our Vision.",
          body: "To be one of the most trusted software development companies in Nigeria, known for combining strong engineering with a clear understanding of how local businesses operate.",
        },
      ],
    },
    {
      kind: "cards",
      id: "values",
      heading: "Five values we actually use, not just publish.",
      cards: [
        {
          title: "Quality.",
          body: "Every product we build is held to a standard we would be comfortable using ourselves. That applies to the code, the design, and how the finished product performs.",
        },
        {
          title: "Integrity.",
          body: "We give honest information about timelines, costs, and technical decisions, even when it is not what a client expected to hear. You will always know where your project really stands.",
        },
        {
          title: "Continuous Improvement.",
          body: "We keep our tools and methods up to date, and we adopt new ones only when they genuinely improve the product we are building. New is not the same as better.",
        },
        {
          title: "Partnership.",
          body: "We aim to build long working relationships with our clients, not just complete a single project. Most of the businesses we work with are still with us.",
        },
        {
          title: "Reliability.",
          body: "We treat deadlines, communication, and handover commitments as exactly that: commitments.",
        },
      ],
    },
    {
      kind: "rich",
      id: "stack",
      heading: "The tools we build with.",
      body: [
        "We build with Next.js, React, and TypeScript on the front end, NestJS on the back end, PostgreSQL with Prisma for data, Tailwind CSS for interfaces, and Figma for design. We chose these tools for performance and easy long-term maintenance, and we adjust them to fit each project rather than forcing every project to fit them.",
      ],
    },
    {
      kind: "cards",
      id: "team",
      heading: "The people doing the work.",
      cards: [
        {
          title: "Chinedu Nwogu, Founder and Chief Executive Officer.",
          body: "Chinedu founded Nexoris Technologies to build software that solves real problems for businesses in Nigeria and abroad. He leads the company's technical direction and works directly on every project, from planning through to delivery. When you hire Nexoris Technologies, he is in the room.",
        },
      ],
    },
    {
      kind: "dynamic",
      id: "team-grid",
      note: "Team grid from Strapi, growing as the team grows",
    },
    {
      kind: "rich",
      id: "careers-teaser",
      heading: "If you care about doing this properly, we should talk.",
      body: [
        "We hire people who care that the thing works, looks right, and holds up after launch.",
      ],
      link: { label: "See open roles", href: "/careers" },
    },
    {
      kind: "cta-band",
      id: "cta-band",
      heading: "We would welcome the chance to discuss your project.",
      body: "Tell us what you are trying to achieve, and we will come back with a clear suggestion and honest numbers.",
      button: { label: "Work with us", href: "/contact" },
    },
  ],
};
