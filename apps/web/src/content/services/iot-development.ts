/**
 * IoT Development service page, transcribed verbatim from the approved Website Copy (Part 2).
 */
import type { MarketingPage } from "../types.js";

export const iotDevelopment: MarketingPage = {
  meta: {
    slug: "/iot-development",
    routeClass: "service",
    title: "IoT Development & Monitoring | Nexoris Technologies",
    description:
      "Fleet tracking, cold room monitoring, and equipment alerts that turn raw sensor data into clear warnings and real savings, designed for Nigerian connectivity.",
  },
  hero: {
    h1: "Your trucks, machines, and cold rooms have a lot to tell you.",
    subline:
      "We build the software that turns readings from your vehicles, machines, and sensors into dashboards, alerts, and reports your operations team can act on. We handle both the device side and the platform that sits on top.",
    primaryCta: { label: "Discuss my IoT project", href: "/contact" },
    secondaryCta: { label: "Find the right service", href: "#solution-finder" },
  },
  sections: [
    {
      kind: "cards",
      id: "pain",
      heading: "Right now, something in your operation is failing quietly.",
      cards: [
        {
          body: "The fuel numbers never quite add up between depots, and everyone has a theory.",
        },
        {
          body: "The cold room drifted overnight. We found out from the stock, not from an alert.",
        },
        {
          body: "That machine gave warning signs for weeks. Nobody could read them until it stopped the line.",
        },
      ],
      closingLine:
        "The signals were all there. What was missing was the system that hears them and tells the right person in time. That is the system we build.",
    },
    {
      kind: "cards",
      id: "scope",
      heading: "What we build.",
      cards: [
        {
          title: "Fleet tracking.",
          body: "Every vehicle live on a map, with driver behaviour and fuel monitoring, so detours and theft lose their cover.",
        },
        {
          title: "Cold room and temperature monitoring.",
          body: "Continuous readings with alerts the moment something drifts, before the stock pays for it.",
        },
        {
          title: "Production line and equipment monitoring.",
          body: "Machine health visible in real time, with the warning signs surfaced instead of buried.",
        },
        {
          title: "Farm sensor networks.",
          body: "Soil, weather, and equipment readings turned into advice a farm team can act on.",
        },
        {
          title: "Smart building and energy tools.",
          body: "Power, water, and facilities tracked and trimmed across sites.",
        },
        {
          title: "Asset tracking with location fences.",
          body: "Know where valuable equipment is, and hear immediately when it leaves where it should be.",
        },
      ],
    },
    {
      kind: "cards",
      id: "ai-where-it-helps",
      heading: "From raw readings to early warnings.",
      cards: [
        {
          title: "Maintenance alerts before a machine fails.",
          body: "The sensor pattern that comes before a breakdown gets recognised, and the fix happens on your schedule instead of the machine's.",
        },
        {
          title: "Drift warnings.",
          body: "Temperature, vibration, or consumption moving away from normal gets flagged while it is still a small problem.",
        },
        {
          title: "Smarter routes and schedules.",
          body: "Plans that account for real traffic, real loads, and real history.",
        },
        {
          title: "Cameras that watch for quality and safety.",
          body: "Defects and unsafe situations spotted as they happen, not in the post-incident review.",
        },
        {
          title: "Fuel and energy recommendations.",
          body: "The data says where the waste is. The system says it out loud.",
        },
      ],
      closingLine:
        "Plain monitoring is sometimes enough. We will tell you when it is.",
    },
    {
      kind: "rich",
      id: "process",
      heading: "How an IoT project runs.",
      body: [
        "We define the use case first, in money terms: what failure, theft, or waste are we trying to catch, and what is it worth to catch it. Then we plan the devices and connectivity around your real coverage, build the platform, and pilot on a small slice of the operation, a few trucks, one cold room, one line. The pilot proves the value with your own numbers before you scale, and the system is built to store readings locally and catch up when the network drops, because in real operations it will.",
      ],
    },
    {
      kind: "rich",
      id: "proof",
      heading: "What listening to your equipment is worth.",
      body: [
        "The breakdown caught a week early costs a service visit instead of a stopped line. The cold room alert at 2am costs a phone call instead of the stock. The fuel that used to disappear between depots starts arriving, because everyone knows the system is watching.",
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
      heading: "Where we deploy this most.",
      note: "Cards: Logistics, Manufacturing, Agriculture, Construction, Healthcare",
    },
    {
      kind: "faq",
      id: "faq",
      heading: "Asked before every IoT project.",
      items: [
        {
          question: "What happens when the network drops?",
          answer:
            "The devices keep recording locally and the platform catches up when the connection returns. Nothing is lost, and alerts that matter can also go out by SMS. We design for Nigerian connectivity as it is, not as the brochure says.",
        },
        {
          question: "Do you supply the hardware?",
          answer:
            "We specify and source proven devices for the job, or work with hardware you already have. The honest answer on build versus buy for devices is almost always buy, and we will say so.",
        },
        {
          question: "Can this work with our existing trackers or sensors?",
          answer:
            "Usually yes. Many operations already have devices and just lack the platform that makes the data useful. The audit confirms what your current hardware can give us.",
        },
        {
          question: "How fast do we see value?",
          answer:
            "The pilot is designed to answer that with your own numbers, typically within one or two months of going live on the first vehicles or machines.",
        },
        {
          question: "Is the data secure?",
          answer:
            "Device traffic is encrypted, access is role-based, and the platform follows the same security standards as everything else we build. Operational data is competitive data, and we treat it that way.",
        },
      ],
    },
    {
      kind: "cta-band",
      id: "cta-band",
      heading:
        "The signals are already there. Let us build the system that hears them.",
      button: { label: "Discuss my IoT project", href: "/contact" },
    },
  ],
};
