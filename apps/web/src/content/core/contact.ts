/**
 * Contact page content, transcribed verbatim from the approved Website Copy (Part 1, Contact).
 * The industry dropdown options and the map are dynamic, so they are not transcribed as copy.
 */
import type { MarketingPage } from "../types.js";

export const contact: MarketingPage = {
  meta: {
    slug: "/contact",
    routeClass: "contact",
    title: "Contact Us | Nexoris Technologies",
    description:
      "Share your goal and we will reply within one business day with a short call, a suggested approach, and honest numbers on cost. No obligation on your part here.",
  },
  hero: {
    h1: "Tell us what you are trying to achieve.",
    subline:
      "Share what you are trying to achieve. We will reply within one business day with a short scoping call, a suggested approach, and a realistic sense of timeline and cost. There is no obligation on your part.",
  },
  sections: [
    {
      kind: "form",
      id: "form",
      heading: "Start the conversation.",
      fields: [
        { label: "Your name" },
        { label: "Email address" },
        { label: "Phone (optional)" },
        { label: "Company or organisation" },
        { label: "Your industry" },
        {
          label: "What do you need?",
          microcopy:
            "Write it the way you would say it. Rough notes are fine, our assistant will help shape them.",
        },
        {
          label: "Budget range (optional)",
          microcopy:
            "Helps us suggest the right starting point. Skip it if you prefer.",
        },
        {
          label: "When do you want to start?",
          options: [
            "As soon as possible",
            "Within three months",
            "Later this year",
            "Just exploring",
          ],
        },
      ],
      briefBuilder: {
        heading: "Want help shaping this?",
        body: "Type your rough notes and our assistant will arrange them into a clear brief: your goal, your current situation, and a sensible first step. You review and edit everything before it sends. Nothing goes out without your approval.",
        buttons: ["Shape my notes into a brief", "Send as written"],
      },
      submitLabel: "Send my brief",
      afterSubmit:
        "Thank you. A real person reads every brief, and you will hear from us within one business day.",
    },
    {
      kind: "rich",
      id: "channels",
      heading: "Other ways to reach us.",
      body: [
        "WhatsApp: message us directly, we reply during business hours. Phone: +234 913 813 3224. General questions: hello@nexoristech.com. New business: business@nexoristech.com. LinkedIn: Nexoris Technologies.",
        "No. 5, Mojisola Dokpesi Street, Ajah, Lekki Lagos",
      ],
    },
    {
      kind: "steps",
      id: "next",
      heading: "What happens after you send this.",
      steps: [
        {
          title: "We read it properly.",
          body: "A real person, not an autoresponder, and you hear back within one business day.",
        },
        {
          title: "A short call.",
          body: "Usually thirty minutes, to understand the problem behind the request. You do the talking.",
        },
        {
          title: "A written proposal.",
          body: "Scope, milestones, and honest numbers. You decide from there, with no pressure from us.",
        },
      ],
    },
    {
      kind: "faq",
      id: "faq",
      heading: "Worth knowing before you write.",
      items: [
        {
          question: "Is my project too small for you?",
          answer:
            "Probably not. We build single websites and multi-year platforms with the same process. If we are genuinely not the right fit, we will say so and point you somewhere better.",
        },
        {
          question: "How quickly can you start?",
          answer:
            "Discovery can usually begin within one to two weeks of an agreed scope. If your timeline is tight, say so in the brief and we will tell you honestly what is possible.",
        },
        {
          question: "Will you sign an NDA?",
          answer: "Yes, happily, before you share anything sensitive.",
        },
        {
          question: "We are not in Lagos. Does that matter?",
          answer:
            "No. We work with clients across Nigeria and abroad. Calls, demos, and delivery all run the same way remotely.",
        },
        {
          question: "Who owns the work at the end?",
          answer:
            "You do, completely. All source code, designs, and project files are handed over at handover. Nothing is held back.",
        },
      ],
    },
    {
      kind: "rich",
      id: "privacy-note",
      body: [
        "Your details stay with us and are handled in line with the NDPR.",
      ],
    },
  ],
};
