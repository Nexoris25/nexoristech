/**
 * Religious Organisations & Faith Communities industry page, transcribed verbatim from the
 * approved Website Copy (Part 3).
 */
import type { MarketingPage } from "../types.js";

export const churchManagementSoftware: MarketingPage = {
  meta: {
    slug: "/church-management-software",
    routeClass: "industry",
    title: "Church Management Software | Nexoris Technologies",
    description:
      "Member management, digital giving, and multi-branch coordination tools for churches, mosques, and ministries. Clear, accountable records and a much wider reach.",
  },
  hero: {
    h1: "Spend your time on ministry and let the system handle the admin.",
    subline:
      "We build member management systems, digital giving platforms, and multi-branch coordination tools for churches, mosques, and ministries. Attendance and giving records become clear and accountable, your messages reach every member, and your leaders get their evenings back.",
    primaryCta: { label: "Talk to us about your ministry", href: "/contact" },
    secondaryCta: { label: "Find the right service", href: "#solution-finder" },
  },
  sections: [
    {
      kind: "cards",
      id: "pain",
      heading: "The calling was ministry. The reality is often spreadsheets.",
      cards: [
        {
          body: "Registration is a notebook at the door, and attendance is whoever counted that day.",
        },
        {
          body: "Giving comes in through cash, transfers, and POS, and accounting for all of it takes a committee.",
        },
        {
          body: "Coordinating one event across our branches takes forty phone calls.",
        },
        {
          body: "Announcements go out on WhatsApp, SMS, and email, and still half the members say they never heard.",
        },
      ],
      closingLine:
        "None of this is what anyone was called to do. The administration is real and it matters, which is exactly why it deserves a proper system instead of a tired volunteer.",
    },
    {
      kind: "cards",
      id: "solutions",
      heading: "What we build for faith communities.",
      cards: [
        {
          title: "Management systems.",
          body: "Members, families, departments, and branches in one organised place.",
        },
        {
          title: "Member portals and apps.",
          body: "Members see announcements, events, and resources, and update their own details.",
        },
        {
          title: "Digital giving.",
          body: "Tithes, offerings, and pledges given from a phone, recorded automatically, and accounted for transparently.",
        },
        {
          title: "Event coordination across branches.",
          body: "One event, every branch, one plan, without the forty phone calls.",
        },
        {
          title: "Livestream and content platforms.",
          body: "Services and teaching reaching members wherever they are.",
        },
        {
          title: "Volunteer scheduling.",
          body: "The rosters that run every service, organised and reminded automatically.",
        },
        {
          title: "Small group management.",
          body: "Groups, leaders, and attendance tracked, so pastoral care knows where to look.",
        },
      ],
    },
    {
      kind: "cards",
      id: "ai-where-it-helps",
      heading: "Where AI can serve the community.",
      cards: [
        {
          title: "A member questions chatbot.",
          body: "Service times, event details, and resources answered instantly, at any hour.",
        },
        {
          title: "Sermons transcribed and translated automatically.",
          body: "Every message becomes searchable text, available in more languages than the pulpit speaks.",
        },
        {
          title: "Devotional content matched to each member.",
          body: "The right encouragement reaching the right person, by their own preference.",
        },
        {
          title: "Attendance patterns made visible.",
          body: "The member who has quietly stopped coming gets noticed by someone who cares, while a visit still matters.",
        },
        {
          title: "Giving follow-ups handled automatically.",
          body: "Thank-you messages and records sent properly, every time.",
        },
      ],
      closingLine:
        "Technology in service of the ministry, never the other way around.",
    },
    {
      kind: "rich",
      id: "outcomes",
      heading: "What changes across the congregation.",
      body: [
        "Engagement strengthens across every branch because communication finally lands. Giving records become something you can account for openly, which builds trust inside and outside the community. The reach extends beyond the building, and the leaders who used to spend evenings on spreadsheets spend them on people.",
      ],
    },
    {
      kind: "dynamic",
      id: "services-links",
      heading: "Built with these services.",
      note: "Cards: AI Product Development, Chatbots & Virtual Assistants, Dashboards & Analytics, Managed Technology Operations",
    },
    {
      kind: "rich",
      id: "proof",
      heading: "From communities like yours.",
    },
    {
      kind: "dynamic",
      id: "proof-cards",
      note: "Case study cards from Strapi, filtered by industry tag, plus testimonial",
    },
    {
      kind: "faq",
      id: "faq",
      heading: "Asked by every administrator and pastor we meet.",
      items: [
        {
          question: "How transparent are the giving records?",
          answer:
            "Fully, and configurable to your governance: every gift recorded, reports for leadership and auditors, and individual privacy protected. Transparency and discretion are both built in.",
        },
        {
          question: "Is member data safe?",
          answer:
            "Yes. Members trust you with personal details, and the system honours that: encrypted, access-controlled, NDPR-aligned, and never shared.",
        },
        {
          question:
            "Can it handle multiple branches with one headquarters view?",
          answer:
            "Yes. Each branch runs day to day, and headquarters sees the whole picture, with the structure following yours rather than forcing a new one.",
        },
        {
          question: "Many of our members are not technical. Will they cope?",
          answer:
            "The member-facing tools are deliberately simple, and nothing requires the app: members who prefer SMS or the front desk are served just as well.",
        },
        {
          question: "Does digital giving work with Nigerian banks and POS?",
          answer:
            "Yes, through the standard local payment channels, with every method landing in one reconciled record.",
        },
      ],
    },
    {
      kind: "cta-band",
      id: "cta-band",
      heading:
        "You were called to shepherd people. Let the software carry the paperwork.",
      button: { label: "Talk to us about your ministry", href: "/contact" },
    },
  ],
};
