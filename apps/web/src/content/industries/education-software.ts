/**
 * Education & EdTech industry page, transcribed verbatim from the approved Website Copy
 * (Part 3). Industry section order: hero, pain, solutions, ai-where-it-helps, outcomes,
 * services-links, proof, faq, cta-band (PRD 12).
 */
import type { MarketingPage } from "../types.js";

export const educationSoftware: MarketingPage = {
  meta: {
    slug: "/education-software",
    routeClass: "industry",
    title: "School Management Software in Nigeria | Nexoris Technologies",
    description:
      "School management systems, admission portals, parent apps, and learning platforms for Nigerian schools. Less admin for staff, clearer records for leadership.",
  },
  hero: {
    h1: "Run your school without drowning in paperwork.",
    subline:
      "We build school management systems, admission portals, parent apps, and learning platforms for schools, universities, and EdTech companies. Your teachers get their time back, your fees add up correctly the first time, and you can finally see the whole school on one screen.",
    primaryCta: { label: "Talk to us about your school", href: "/contact" },
    secondaryCta: { label: "Find the right service", href: "#solution-finder" },
  },
  sections: [
    {
      kind: "cards",
      id: "pain",
      heading: "If you run a school, you already know this list.",
      cards: [
        {
          body: "Admissions season means stacks of paper forms and three weeks of typing.",
        },
        {
          body: "Fees come in through five channels, and the figures never quite balance at the end of the month.",
        },
        {
          body: "A parent calls asking how their child is doing, and the honest answer is that we would have to go and check several books.",
        },
        {
          body: "By the time we notice a student is struggling, the term is nearly over.",
        },
      ],
      closingLine:
        "None of this is a staffing problem. It is a systems problem, and a school management system built around how your school actually runs solves it term by term.",
    },
    {
      kind: "cards",
      id: "solutions",
      heading: "What we build for schools.",
      cards: [
        {
          title: "School management systems.",
          body: "Students, staff, classes, results, and finances in one place, shaped around your school rather than a generic template.",
        },
        {
          title: "Admission portals with online payment.",
          body: "Parents apply and pay from their phones, and your admissions list builds itself.",
        },
        {
          title: "Parent and student apps.",
          body: "Results, attendance, fees, and announcements in every parent's pocket, so the phone calls become check-ins rather than investigations.",
        },
        {
          title: "Learning platforms.",
          body: "Lessons, assignments, and tests online, for the classroom and for the days students cannot be in it.",
        },
        {
          title: "Fee management.",
          body: "Every payment recorded against the right student automatically, with arrears visible at a glance.",
        },
        {
          title: "Timetabling.",
          body: "Clash-free timetables in hours instead of the annual week of pain.",
        },
        {
          title: "Staff records, library, hostel, and alumni modules.",
          body: "The rest of the school, organised in the same place.",
        },
      ],
    },
    {
      kind: "cards",
      id: "ai-where-it-helps",
      heading: "Where AI can help, if you want it.",
      cards: [
        {
          title: "Tutoring support for students.",
          body: "A patient assistant that explains, drills, and never tires of the same question.",
        },
        {
          title: "Automatic marking.",
          body: "Objective tests marked instantly, essays first-marked for the teacher to review and finalise.",
        },
        {
          title: "Plagiarism checks.",
          body: "Submitted work checked automatically, with the evidence laid out.",
        },
        {
          title: "Learning paths that adjust.",
          body: "Each student gets practice pitched at their level, not the class average.",
        },
        {
          title: "Early alerts for struggling students.",
          body: "Attendance, results, and engagement patterns flag a student who needs help while help can still change the term.",
        },
        {
          title: "An admissions chatbot.",
          body: "Parent questions answered instantly, at any hour, during the busiest season.",
        },
        {
          title: "Automatic timetabling.",
          body: "The clash-free timetable, generated rather than wrestled.",
        },
        {
          title: "Lecture recordings turned into notes.",
          body: "Spoken lessons become searchable text for revision.",
        },
      ],
      closingLine:
        "You choose which of these fit your school. None of them are forced in.",
    },
    {
      kind: "rich",
      id: "outcomes",
      heading: "What changes by next term.",
      body: [
        "Less admin for staff and a faster admissions cycle. Fees that reconcile fully, with arrears visible instead of discovered. Parents who feel informed because they are. Struggling students flagged early enough to help. And leadership with a live view of the academics and the finances, on one screen, any day of the term.",
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
      heading: "From institutions like yours.",
      intro:
        "Education is a sector we know from the inside: we built our own exam preparation platform, and the story is on our case studies page.",
    },
    {
      kind: "dynamic",
      id: "proof-cards",
      note: "Case study cards from Strapi, filtered by industry tag",
    },
    {
      kind: "faq",
      id: "faq",
      heading: "Asked by every proprietor and registrar we meet.",
      items: [
        {
          question: "Can it handle our fee structure? It is complicated.",
          answer:
            "Almost certainly. Sibling discounts, instalments, scholarships, class-by-class fees: we build the structure around your actual rules rather than asking you to simplify them.",
        },
        {
          question: "Will our staff manage with it? Not everyone is technical.",
          answer:
            "Yes. We design for the least technical person who will use the system, and training is part of every delivery. If staff need a manual on the desk to use it, we designed it badly.",
        },
        {
          question: "Can parents really pay school fees online?",
          answer:
            "Yes, through Paystack, Flutterwave, and other Nigerian gateways, with every payment recorded against the right student automatically.",
        },
        {
          question: "What happens to our existing records?",
          answer:
            "We migrate them. Past results, student records, and fee histories move into the new system in a supervised process, checked before anything is retired.",
        },
        {
          question: "How long does it take to set up?",
          answer:
            "Most schools go live in stages over one to three months, timed around your term calendar so the switch never lands mid-exams.",
        },
      ],
    },
    {
      kind: "cta-band",
      id: "cta-band",
      heading:
        "Your teachers became teachers to teach. Let us take the paperwork off their desks.",
      button: { label: "Talk to us about your school", href: "/contact" },
    },
  ],
};
