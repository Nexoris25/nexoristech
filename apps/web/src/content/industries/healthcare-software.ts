/**
 * Healthcare, Hospitals & Clinics industry page, transcribed verbatim from the approved
 * Website Copy (Part 3).
 */
import type { MarketingPage } from "../types.js";

export const healthcareSoftware: MarketingPage = {
  meta: {
    slug: "/healthcare-software",
    routeClass: "industry",
    title: "Hospital & Clinic Software in Nigeria | Nexoris Technologies",
    description:
      "Electronic health records, hospital management, telemedicine, and pharmacy systems for Nigerian hospitals and clinics. Patient data stays protected throughout.",
  },
  hero: {
    h1: "More time with patients. Less time searching for files.",
    subline:
      "We build electronic health records, hospital management systems, telemedicine apps, and pharmacy tools for hospitals, clinics, labs, and HMOs. Records become findable in seconds, reminders reach patients on their phones, and patient data is handled the way the law requires.",
    primaryCta: { label: "Talk to us about your facility", href: "/contact" },
    secondaryCta: { label: "Find the right service", href: "#solution-finder" },
  },
  sections: [
    {
      kind: "cards",
      id: "pain",
      heading: "Every clinician knows the cost of a missing file.",
      cards: [
        {
          body: "The patient is in front of you, and their folder is somewhere in the records room.",
        },
        {
          body: "The waiting room is full, and somehow the specialist's afternoon is half empty.",
        },
        { body: "A third of today's appointments simply did not show up." },
        {
          body: "The pharmacy ran out of one drug and watched another expire on the shelf.",
        },
      ],
      closingLine:
        "Each of these has a known fix, and none of the fixes require your staff to work harder. They require systems that carry the load.",
    },
    {
      kind: "cards",
      id: "solutions",
      heading: "What we build for healthcare.",
      cards: [
        {
          title: "Electronic health records.",
          body: "Every patient's history, findable in seconds, complete at the point of care.",
        },
        {
          title: "Hospital management systems.",
          body: "Admissions, billing, wards, and departments running on one system instead of parallel paper.",
        },
        {
          title: "Patient portals.",
          body: "Patients book, see results, and manage their care from their phones.",
        },
        {
          title: "Telemedicine apps.",
          body: "Consultations by video for the patients who cannot come in, with notes and prescriptions flowing into the same record.",
        },
        {
          title: "Pharmacy management.",
          body: "Stock, expiries, and dispensing tracked properly, so shortages and waste both shrink.",
        },
        {
          title: "Lab systems.",
          body: "Samples tracked from request to result, with results landing in the patient record automatically.",
        },
        {
          title: "HMO claim portals.",
          body: "Claims submitted clean the first time, which is most of the battle against rejections.",
        },
        {
          title: "Appointment booking with SMS and WhatsApp reminders.",
          body: "The single cheapest fix for no-shows that exists.",
        },
      ],
    },
    {
      kind: "cards",
      id: "ai-where-it-helps",
      heading: "Where AI can support care, carefully.",
      cards: [
        {
          title: "A symptom triage chatbot.",
          body: "Patients describe what is wrong in their own words and get guided to the right clinic at the right urgency.",
        },
        {
          title: "Decision support for clinicians.",
          body: "Relevant history and considerations surfaced at the point of care, with the clinician always deciding.",
        },
        {
          title: "Readmission alerts.",
          body: "Patients at higher risk of coming back get flagged for structured follow-up before discharge.",
        },
        {
          title: "Medication reminders.",
          body: "Adherence support that meets patients on their phones.",
        },
        {
          title: "Smarter scheduling.",
          body: "Appointment patterns used to cut both queues and empty specialist hours.",
        },
        {
          title: "Clinician notes typed up automatically.",
          body: "Spoken notes become structured records, and clinicians get minutes back per patient.",
        },
        {
          title: "Claims checked for fraud.",
          body: "Unusual claim patterns flagged before they cost you.",
        },
      ],
      closingLine:
        "In healthcare we add AI carefully, with a clinician's judgement always in charge.",
    },
    {
      kind: "rich",
      id: "outcomes",
      heading: "What changes for patients and staff.",
      body: [
        "Patients move through faster because the record is already open when they sit down. No-shows drop because the reminder arrived where the patient actually looks. Medication and billing errors fall, claim rejections fall with them, and the data behind all of it is handled in line with the NDPR, which in healthcare is not optional.",
      ],
    },
    {
      kind: "dynamic",
      id: "services-links",
      heading: "Built with these services.",
      note: "Cards: AI Product Development, Chatbots & Virtual Assistants, Business Process Automation, Data Infrastructure & AI Readiness, Managed Technology Operations",
    },
    {
      kind: "rich",
      id: "proof",
      heading: "From facilities like yours.",
    },
    {
      kind: "dynamic",
      id: "proof-cards",
      note: "Case study cards from Strapi, filtered by industry tag, plus testimonial",
    },
    {
      kind: "faq",
      id: "faq",
      heading: "Asked by every medical director we meet.",
      items: [
        {
          question: "How is patient data protected?",
          answer:
            "Encryption, role-based access so staff see only what their role requires, full audit trails, and NDPR-aligned retention. We treat health data as the most sensitive category we handle, because it is.",
        },
        {
          question: "What happens when the internet goes down?",
          answer:
            "Care continues. The system is designed to keep working locally through outages and sync when the connection returns. We build for Nigerian infrastructure as it actually is.",
        },
        {
          question: "Can we move from paper without disrupting the clinic?",
          answer:
            "Yes, in stages. Records are digitised in a supervised process, departments switch over one at a time, and paper runs alongside until everyone trusts the system. No big-bang switchover on a Monday morning.",
        },
        {
          question: "Does it work with our HMO processes?",
          answer:
            "Yes. Claims, approvals, and reconciliation are built into the workflow, and submitting clean claims the first time is where most rejection problems end.",
        },
        {
          question: "Our facility is small. Is this still for us?",
          answer:
            "Yes. A two-doctor clinic and a teaching hospital need different sizes of the same discipline, and the system is scoped to yours. Small facilities often feel the benefit fastest.",
        },
      ],
    },
    {
      kind: "cta-band",
      id: "cta-band",
      heading:
        "A lost file costs more than money in your line of work. Make every record findable in seconds.",
      button: { label: "Talk to us about your facility", href: "/contact" },
    },
  ],
};
