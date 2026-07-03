/**
 * AI Chatbots & Virtual Assistants service page, transcribed from the approved design handoff
 * (ai-chatbots-virtual-assistants.html). The hero uses the interactive multi-channel chat demo
 * widget. Copy, icons, and FAQ match the handoff; proof states honest "once it's live" outcomes
 * without fabricated figures. Consumed by the ServiceView template.
 */
import type { ServiceContent } from "../../components/service/ServiceView.js";
import { ChatWidget } from "../../components/service/ChatWidget.js";

export const aiChatbotsVirtualAssistants: ServiceContent = {
  breadcrumb: "AI Chatbots & Virtual Assistants",
  heroWidget: <ChatWidget />,
  hero: {
    kicker: "Automate the busywork · Customer answers",
    h1: "An assistant that answers every customer, at any hour, in their language.",
    lede: "We build assistants trained on your own documents, prices, and policies, so the answers match your business and not the internet. When a conversation needs a person, it hands over to your team with the full history attached.",
    primaryCta: { label: "Build my assistant", href: "/contact" },
    secondaryCta: { label: "See what we build", href: "#scope" },
    stats: [],
  },
  problem: {
    kicker: "The silent inbox",
    h2: "Every unanswered message is a customer deciding you were too slow.",
    quotes: [
      {
        text: "The enquiry came in at 9pm. By the time we replied at 10am, they had bought elsewhere.",
        tag: "Lost overnight",
      },
      {
        text: "My team answers the same ten questions all day. It is all they have time for.",
        tag: "The repetition tax",
      },
      {
        text: "Leads come in from the website, Instagram, and WhatsApp, and honestly, some just go cold in the pile.",
        tag: "The scattered inbox",
      },
    ],
    close: (
      <>
        Your customers are not asking hard questions. They are asking the same questions, at hours
        you cannot staff. <b>That is exactly the job an assistant is built for.</b>
      </>
    ),
  },
  scope: {
    kicker: "What we build",
    h2: "The assistants we build.",
    items: [
      {
        icon: (
          <>
            <rect x="3" y="4" width="18" height="14" rx="2" />
            <path d="M3 9h18M8 21h8M12 18v3" />
          </>
        ),
        title: "Website, WhatsApp, and Messenger chatbots",
        body: "Customers get answers where they already are, in the channel they already use.",
      },
      {
        icon: (
          <>
            <path d="M4 19V5a2 2 0 0 1 2-2h9l5 5v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
            <path d="M8 13h8M8 16h5" />
          </>
        ),
        title: "Internal assistants for your staff",
        body: "New hires and busy teams get instant answers from your own policies and manuals instead of interrupting a colleague.",
      },
      {
        icon: (
          <>
            <path d="M3 5h18M3 12h18M3 19h12" />
            <circle cx="20" cy="19" r="2.4" />
          </>
        ),
        title: "Lead qualification bots",
        body: "Every enquiry gets answered, sorted, and scored, so your salespeople call the right person first.",
      },
      {
        icon: (
          <>
            <rect x="9" y="3" width="6" height="11" rx="3" />
            <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
          </>
        ),
        title: "Voice assistants for phone lines and call centres",
        body: "Callers get help immediately instead of holding, and your agents get the complicated cases.",
      },
      {
        icon: (
          <>
            <circle cx="12" cy="12" r="9" />
            <path d="M3 12h18M12 3c2.5 2.5 4 5.7 4 9s-1.5 6.5-4 9c-2.5-2.5-4-5.7-4-9s1.5-6.5 4-9z" />
          </>
        ),
        title: "Multilingual support",
        body: "English, Pidgin, Yoruba, Hausa, Igbo, and French, following the customer's language rather than forcing yours.",
      },
    ],
  },
  ai: {
    kicker: "How it stays honest",
    h2: "Why the answers stay accurate.",
    intro:
      "The assistant reads from your own content only. It does not improvise from the internet, and the moment a conversation needs a person, it escalates with the full transcript attached.",
    feats: [
      {
        icon: (
          <>
            <path d="M14 3v5h5" />
            <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M8 13h8M8 17h5" />
          </>
        ),
        title: "Your content only",
        body: "Policies, catalogue, FAQs, and prices. Not the open internet.",
      },
      {
        icon: <path d="M3 12a9 9 0 0 1 18 0M12 8v4l3 2" />,
        title: "Knows the context",
        body: "It connects to your CRM and helpdesk, so it answers with the full picture.",
      },
      {
        icon: <path d="M12 2l2.4 5 5.6.6-4.2 3.8 1.2 5.6L12 19l-5 3 1.2-5.6L4 12.6 9.6 12z" />,
        title: "Reads the mood",
        body: "It notices when someone is upset and moves them up the queue.",
      },
      {
        icon: (
          <>
            <circle cx="9" cy="8" r="3.4" />
            <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
            <path d="M16 8h5M18.5 5.5v5" />
          </>
        ),
        title: "Hands to a human",
        body: "When it must, it escalates with the full transcript, so nobody repeats themselves.",
      },
    ],
    foot: "And you get a dashboard showing what it handled, what it could not, and where your content has gaps worth filling.",
  },
  process: {
    h2: "A working assistant in four to eight weeks.",
    steps: [
      {
        title: "We gather your content",
        body: "We collect your policies, prices, and FAQs, then train the assistant on them so every answer comes from your business.",
      },
      {
        title: "We test it hard",
        body: "We put it up against real questions from your actual customers before anyone else meets it, and fix what it gets wrong.",
      },
      {
        title: "It launches in stages",
        body: "We start where the volume is highest, so you see value first and the rollout stays under control.",
      },
      {
        title: "We tune it monthly",
        body: "We review the questions it struggled with and sharpen it every month, so it keeps getting better.",
      },
    ],
    note: (
      <>
        Replies arrive in seconds, and the nights stop costing you sales.{" "}
        <b>The repetitive tickets stop reaching your team, so the complicated ones finally get proper
        attention.</b>
      </>
    ),
  },
  proof: {
    kicker: "What changes once it is live",
    h2: "Replies in seconds. Nights stop costing you sales.",
    lede: "Nothing here is a promise of magic numbers. It is simply what a well-built assistant does once it is answering for you.",
    cards: [
      { tag: "Once it is live", title: "First replies arrive in seconds, instead of the next morning." },
      {
        tag: "Once it is live",
        title: "The repetitive tickets stop reaching your team, so the hard ones get real attention.",
      },
      {
        tag: "Once it is live",
        title: "Overnight enquiries are answered, qualified, and waiting in your CRM by 8am.",
      },
    ],
  },
  industryLinks: {
    kicker: "Industries",
    h2: "Where assistants pay off fastest.",
    lede: "Assistants earn their keep quickest where the same questions arrive around the clock, in volume.",
    links: [
      {
        href: "/retail-ecommerce-software",
        icon: (
          <>
            <path d="M6 8h12l-1 12a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1L6 8z" />
            <path d="M9 8V6a3 3 0 0 1 6 0v2" />
          </>
        ),
        title: "Retail & E-Commerce",
        body: "Storefronts, inventory, and online sales that keep up with demand.",
      },
      {
        href: "/fintech-software",
        icon: <path d="M3 9l9-5 9 5M5 9v8M19 9v8M9 17v-5M15 17v-5M3 21h18" />,
        title: "Financial Services & Fintech",
        body: "Secure banking, payments, and onboarding built to scale.",
      },
      {
        href: "/healthcare-software",
        icon: <path d="M3 12h4l2-6 4 12 2-6h6" />,
        title: "Healthcare & Clinics",
        body: "Records, scheduling, and patient care handled with care.",
      },
      {
        href: "/hospitality-software",
        icon: <path d="M3 18V8M3 12h18v6M21 18v-3M7 12V9a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />,
        title: "Hospitality & Short-Lets",
        body: "Reservations, guests, and revenue handled across properties.",
      },
      {
        href: "/real-estate-software",
        icon: <path d="M3 21V8l9-5 9 5v13M9 21v-5h6v5M8 11h2M14 11h2" />,
        title: "Real Estate",
        body: "Listings, viewings, and tenant management in one portal.",
      },
      {
        href: "/education-software",
        icon: (
          <>
            <path d="M12 4L2 9l10 5 8-4v6" />
            <path d="M6 12v4c0 1.3 2.7 3 6 3s6-1.7 6-3v-4" />
          </>
        ),
        title: "Education & EdTech",
        body: "Enrolment, learning, and fees managed for schools and platforms.",
      },
    ],
  },
  faq: {
    kicker: "Questions",
    h2: "Fair questions about chatbots.",
    lede: "If a bot ever traps your customers, it is doing its job wrong. Here is how we keep that from happening.",
    items: [
      {
        q: "Will it make things up?",
        a: "It answers only from your own content, and when it does not know, it says so and offers a person. That is a design rule, not a hope.",
      },
      {
        q: "Can customers still reach a human?",
        a: "Always, and quickly. The assistant hands over with the full conversation attached, so nobody starts again from the beginning. A bot that traps people is bad business, and we do not build those.",
      },
      {
        q: "What should a bot never handle alone?",
        a: "Anything where the stakes are personal or sensitive: medical decisions, serious complaints, money disputes. The assistant recognises these and routes them straight to your team. That is the honest limit of the tool.",
      },
      {
        q: "Does it really work on WhatsApp?",
        a: "Yes, through the official WhatsApp Business API. For most Nigerian businesses, WhatsApp is where the assistant earns its keep fastest.",
      },
      {
        q: "How long until it pays for itself?",
        a: "Count the hours your team spends on repeated questions each week, and the enquiries lost outside business hours. For most businesses that calculation answers itself within a few months. We will do it with you on the first call.",
      },
    ],
  },
  cta: {
    h2: "Your customers are already asking. Give them an answer that sounds like you.",
    body: "Tell us where the questions pile up. We will reply within one business day with a short call and a clear plan to put an assistant on it.",
    button: { label: "Build my assistant", href: "/contact" },
  },
};
