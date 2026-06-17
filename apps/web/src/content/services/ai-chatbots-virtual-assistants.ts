/**
 * AI Chatbots & Virtual Assistants service page, transcribed verbatim from the approved
 * Website Copy (Part 2). This service is AI by nature, so the AI is the service itself rather than
 * an optional block (PRD 12).
 */
import type { MarketingPage } from "../types.js";

export const aiChatbotsVirtualAssistants: MarketingPage = {
  meta: {
    slug: "/ai-chatbots-virtual-assistants",
    routeClass: "service",
    title: "AI Chatbots & Virtual Assistants | Nexoris Technologies",
    description:
      "Chatbots trained on your own content for your website, WhatsApp, and phone lines, with clear answers in English, Pidgin, Yoruba, Hausa, Igbo, and French today.",
  },
  hero: {
    h1: "An assistant that answers every customer, at any hour, in their language.",
    subline:
      "We build assistants trained on your own documents, prices, and policies, so the answers match your business and not the internet. When a conversation needs a person, it hands over to your team with the full history attached.",
    primaryCta: { label: "Build my assistant", href: "/contact" },
    secondaryCta: {
      label: "See it answer a question",
      href: "#solution-finder",
    },
  },
  sections: [
    {
      kind: "cards",
      id: "pain",
      heading:
        "Every unanswered message is a customer deciding you were too slow.",
      cards: [
        {
          body: "The enquiry came in at 9pm. By the time we replied at 10am, they had bought elsewhere.",
        },
        {
          body: "My team answers the same ten questions all day. It is all they have time for.",
        },
        {
          body: "Leads come in from the website, Instagram, and WhatsApp, and honestly, some of them just go cold in the pile.",
        },
      ],
      closingLine:
        "Your customers are not asking hard questions. They are asking the same questions, at hours you cannot staff. That is exactly the job an assistant is built for.",
    },
    {
      kind: "cards",
      id: "scope",
      heading: "The assistants we build.",
      cards: [
        {
          title: "Website, WhatsApp, and Messenger chatbots.",
          body: "Customers get answers where they already are, in the channel they already use.",
        },
        {
          title: "Internal assistants for your staff.",
          body: "New hires and busy teams get instant answers from your own policies and manuals instead of interrupting a colleague.",
        },
        {
          title: "Lead qualification bots.",
          body: "Every enquiry gets answered, sorted, and scored, so your salespeople call the right person first.",
        },
        {
          title: "Voice assistants for phone lines and call centres.",
          body: "Callers get help immediately instead of holding, and your agents get the complicated cases.",
        },
        {
          title: "Multilingual support.",
          body: "English, Pidgin, Yoruba, Hausa, Igbo, and French, following the customer's language rather than forcing yours.",
        },
      ],
    },
    {
      kind: "rich",
      id: "how-it-stays-accurate",
      heading: "Why the answers stay accurate.",
      body: [
        "The assistant reads from your own content only: your policies, your product catalogue, your FAQs, your prices. It does not improvise from the internet. It connects to your CRM and helpdesk so it knows the context, and the moment a conversation needs a person, it escalates with the full transcript attached, so your customer never repeats themselves. It also notices when someone is upset and moves them up the queue. And you get a dashboard showing what it handled, what it could not, and where your content has gaps worth filling.",
      ],
    },
    {
      kind: "rich",
      id: "process",
      heading: "From your documents to a working assistant.",
      body: [
        "We gather your content, train the assistant on it, and then test it hard against real questions from your actual customers before anyone else meets it. It launches in stages, starting where the volume is highest, and we tune it monthly using the questions it struggled with. Most assistants go from first call to live in four to eight weeks.",
      ],
    },
    {
      kind: "rich",
      id: "proof",
      heading: "What changes once it is live.",
      body: [
        "First replies arrive in seconds instead of hours. The repetitive tickets stop reaching your team, which means the complicated ones finally get proper attention. And enquiries that used to die overnight get answered, qualified, and waiting in your CRM by morning.",
      ],
    },
    {
      kind: "dynamic",
      id: "proof-cards",
      note: "Case study cards from Strapi, filtered by service tag",
    },
    {
      kind: "dynamic",
      id: "industries-links",
      heading: "Where assistants pay off fastest.",
      note: "Cards: Healthcare, Fintech, Government, Hospitality, Retail, Faith Organisations",
    },
    {
      kind: "faq",
      id: "faq",
      heading: "Fair questions about chatbots.",
      items: [
        {
          question: "Will it make things up?",
          answer:
            "It answers only from your own content, and when it does not know, it says so and offers a person. That is a design rule, not a hope.",
        },
        {
          question: "Can customers still reach a human?",
          answer:
            "Always, and quickly. The assistant hands over with the full conversation attached, so nobody starts again from the beginning. A bot that traps people is bad business, and we do not build those.",
        },
        {
          question: "What should a bot never handle alone?",
          answer:
            "Anything where the stakes are personal or sensitive: medical decisions, serious complaints, money disputes. The assistant recognises these and routes them straight to your team. That is the honest limit of the tool.",
        },
        {
          question: "Does it really work on WhatsApp?",
          answer:
            "Yes, through the official WhatsApp Business API. For most Nigerian businesses, WhatsApp is where the assistant earns its keep fastest.",
        },
        {
          question: "How long until it pays for itself?",
          answer:
            "Count the hours your team spends on repeated questions each week, and the enquiries lost outside business hours. For most businesses that calculation answers itself within a few months. We will do it with you on the first call.",
        },
      ],
    },
    {
      kind: "cta-band",
      id: "cta-band",
      heading:
        "Your customers are already asking. Give them an answer that sounds like you.",
      button: { label: "Build my assistant", href: "/contact" },
    },
  ],
};
