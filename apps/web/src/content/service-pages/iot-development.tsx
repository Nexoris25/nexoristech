/**
 * IoT Development service page, transcribed from the approved design handoff (iot-development.html).
 * The hero uses the interactive live-monitor widget. Copy, icons, and FAQ match the handoff; the
 * "from readings to warnings" section is transcribed as the AI feature cards, and proof states
 * honest "what it is worth" outcomes without fabricated figures. Consumed by the ServiceView
 * template.
 */
import type { ServiceContent } from "../../components/service/ServiceView.js";
import { IotMonitor } from "../../components/service/IotMonitor.js";

export const iotDevelopment: ServiceContent = {
  breadcrumb: "IoT Development",
  heroWidget: <IotMonitor />,
  hero: {
    kicker: "Build new software · Sensors & signals",
    h1: "Your trucks, machines, and cold rooms have a lot to tell you.",
    lede: "We build the software that turns readings from your vehicles, machines, and sensors into dashboards, alerts, and reports your operations team can act on. We handle both the device side and the platform that sits on top.",
    primaryCta: { label: "Discuss my IoT project", href: "/contact" },
    secondaryCta: { label: "Find the right service", href: "/#finder" },
    stats: [],
  },
  problem: {
    kicker: "Failing quietly",
    h2: "Right now, something in your operation is failing quietly.",
    quotes: [
      {
        text: "The fuel numbers never quite add up between depots, and everyone has a theory.",
        tag: "Fuel leakage",
      },
      {
        text: "The cold room drifted overnight. We found out from the stock, not from an alert.",
        tag: "No early warning",
      },
      {
        text: "That machine gave warning signs for weeks. Nobody could read them until it stopped the line.",
        tag: "Silent breakdown",
      },
    ],
    close: (
      <>
        The signals were all there. What was missing was the system that hears them and tells the
        right person in time. <b>That is the system we build.</b>
      </>
    ),
  },
  scope: {
    kicker: "What we build",
    h2: "From the device to the dashboard.",
    items: [
      {
        icon: (
          <>
            <path d="M3 7h11v8H3zM14 10h4l3 3v2h-7z" />
            <circle cx="7" cy="17" r="1.6" />
            <circle cx="17.5" cy="17" r="1.6" />
          </>
        ),
        title: "Fleet tracking",
        body: "Every vehicle live on a map, with driver behaviour and fuel monitoring, so detours and theft lose their cover.",
      },
      {
        icon: <path d="M12 3v18M5 7l14 10M19 7L5 17" />,
        title: "Cold room & temperature monitoring",
        body: "Continuous readings with alerts the moment something drifts, before the stock pays for it.",
      },
      {
        icon: <path d="M3 21V9l6 4V9l6 4V5l6 4v12z" />,
        title: "Production line & equipment monitoring",
        body: "Machine health visible in real time, with the warning signs surfaced instead of buried.",
      },
      {
        icon: (
          <>
            <path d="M12 3a6 6 0 0 1 6 6c0 4-6 12-6 12S6 13 6 9a6 6 0 0 1 6-6z" />
            <path d="M9 9c1.5-1.5 4.5-1.5 6 0" />
          </>
        ),
        title: "Farm sensor networks",
        body: "Soil, weather, and equipment readings turned into advice a farm team can act on.",
      },
      {
        icon: (
          <>
            <path d="M3 21V8l9-5 9 5v13M9 21v-7h6v7" />
            <path d="M12 11h.01" />
          </>
        ),
        title: "Smart building & energy tools",
        body: "Power, water, and facilities tracked and trimmed across sites.",
      },
      {
        icon: (
          <>
            <path d="M12 21s-7-4.5-7-10a7 7 0 0 1 14 0c0 5.5-7 10-7 10z" />
            <circle cx="12" cy="11" r="2.4" />
          </>
        ),
        title: "Asset tracking with location fences",
        body: "Know where valuable equipment is, and hear immediately when it leaves where it should be.",
      },
    ],
  },
  ai: {
    kicker: "From readings to warnings",
    h2: "From raw readings to early warnings.",
    intro:
      "The readings are only worth collecting if something acts on them. These are the features that turn a stream of numbers into a warning while there is still time.",
    feats: [
      {
        icon: <path d="M3 12a9 9 0 0 1 18 0M12 8v4l3 2" />,
        title: "Maintenance alerts before a machine fails",
        body: "The sensor pattern that comes before a breakdown gets recognised, and the fix happens on your schedule instead of the machine's.",
      },
      {
        icon: (
          <>
            <path d="M3 17l5-5 4 3 5-7 4 5" />
            <path d="M3 21h18" />
          </>
        ),
        title: "Drift warnings",
        body: "Temperature, vibration, or consumption moving away from normal gets flagged while it is still a small problem.",
      },
      {
        icon: (
          <>
            <circle cx="12" cy="10" r="3" />
            <path d="M12 2a8 8 0 0 0-8 8c0 5.4 8 12 8 12s8-6.6 8-12a8 8 0 0 0-8-8z" />
          </>
        ),
        title: "Smarter routes and schedules",
        body: "Plans that account for real traffic, real loads, and real history.",
      },
      {
        icon: (
          <>
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
            <circle cx="12" cy="12" r="3" />
          </>
        ),
        title: "Cameras that watch for quality and safety",
        body: "Defects and unsafe situations spotted as they happen, not in the post-incident review.",
      },
      {
        icon: <path d="M13 2L4.5 13H11l-1 9 8.5-11H12z" />,
        title: "Fuel and energy recommendations",
        body: "The data says where the waste is. The system says it out loud.",
      },
    ],
    foot: "Plain monitoring is sometimes enough. We will tell you when it is.",
  },
  process: {
    h2: "How an IoT project runs.",
    steps: [
      {
        title: "Define the use case in money terms",
        body: "What failure, theft, or waste are we trying to catch, and what is it worth to catch it.",
      },
      {
        title: "Plan devices and connectivity",
        body: "We plan the hardware and network around your real coverage, not the brochure version of it.",
      },
      {
        title: "Build and pilot on a small slice",
        body: "A few trucks, one cold room, one line. The platform stores readings locally and catches up when the network drops.",
      },
      {
        title: "Prove value, then scale",
        body: "The pilot proves the value with your own numbers before you roll it out across the operation.",
      },
    ],
    note: (
      <>
        We pilot on a small slice of the operation first, and{" "}
        <b>prove the value with your own numbers before you scale.</b>
      </>
    ),
  },
  proof: {
    kicker: "What it is worth",
    h2: "What listening to your equipment is worth.",
    lede: "Nothing here is a magic number. It is simply what a monitored operation stops paying for.",
    cards: [
      {
        tag: "What it is worth",
        title: "The breakdown caught a week early costs a service visit instead of a stopped line.",
      },
      {
        tag: "What it is worth",
        title: "The cold room alert at 2am costs a phone call instead of the stock.",
      },
      {
        tag: "What it is worth",
        title: "The fuel that used to disappear between depots starts arriving.",
      },
    ],
  },
  industryLinks: {
    kicker: "Industries",
    h2: "Where we deploy this most.",
    lede: "IoT pays back fastest where physical assets move, spoil, or wear, and a late signal is expensive.",
    links: [
      {
        href: "/logistics-software",
        icon: (
          <>
            <path d="M3 6h11v9H3zM14 9h4l3 3v3h-7z" />
            <circle cx="7" cy="18" r="1.6" />
            <circle cx="17.5" cy="18" r="1.6" />
          </>
        ),
        title: "Logistics & Supply Chain",
        body: "Fleets, deliveries, and stock tracked from depot to door.",
      },
      {
        href: "/manufacturing-software",
        icon: (
          <>
            <path d="M3 21V9l6 4V9l6 4V6l6 4v11z" />
            <path d="M3 21h18" />
          </>
        ),
        title: "Manufacturing",
        body: "Production lines, quality, and output you can see live.",
      },
      {
        href: "/agritech-software",
        icon: (
          <>
            <path d="M4 20c0-8 5-13 16-14 0 11-5 16-13 16a6 6 0 0 1-3-2z" />
            <path d="M9 17c2-4 5-6 9-7" />
          </>
        ),
        title: "Agriculture & AgriTech",
        body: "Farms, inputs, and yields monitored from field to market.",
      },
      {
        href: "/automotive-software",
        icon: (
          <>
            <path d="M3 13l2-5a2 2 0 0 1 1.9-1.4h10.2A2 2 0 0 1 19 8l2 5v5H3z" />
            <circle cx="7.5" cy="18" r="1.4" />
            <circle cx="16.5" cy="18" r="1.4" />
          </>
        ),
        title: "Automotive",
        body: "Workshops, dealerships, and service bookings organised end to end.",
      },
      {
        href: "/construction-software",
        icon: (
          <>
            <path d="M3 18a9 9 0 0 1 18 0z" />
            <path d="M10 9V6a2 2 0 0 1 4 0v3M6 18v-3M18 18v-3" />
          </>
        ),
        title: "Construction & Engineering",
        body: "Projects, sites, and progress tracked from plan to handover.",
      },
      {
        href: "/real-estate-software",
        icon: <path d="M3 21V8l9-5 9 5v13M9 21v-5h6v5M8 11h2M14 11h2" />,
        title: "Real Estate",
        body: "Listings, viewings, and tenant management in one portal.",
      },
    ],
  },
  faq: {
    kicker: "Questions",
    h2: "Asked before every IoT project.",
    lede: "The honest answers about connectivity, hardware, and how fast you see value.",
    items: [
      {
        q: "What happens when the network drops?",
        a: "The devices keep recording locally and the platform catches up when the connection returns. Nothing is lost, and alerts that matter can also go out by SMS. We design for Nigerian connectivity as it is, not as the brochure says.",
      },
      {
        q: "Do you supply the hardware?",
        a: "We specify and source proven devices for the job, or work with hardware you already have. The honest answer on build versus buy for devices is almost always buy, and we will say so.",
      },
      {
        q: "Can this work with our existing trackers or sensors?",
        a: "Usually yes. Many operations already have devices and just lack the platform that makes the data useful. The audit confirms what your current hardware can give us.",
      },
      {
        q: "How fast do we see value?",
        a: "The pilot is designed to answer that with your own numbers, typically within one or two months of going live on the first vehicles or machines.",
      },
      {
        q: "Is the data secure?",
        a: "Device traffic is encrypted, access is role-based, and the platform follows the same security standards as everything else we build. Operational data is competitive data, and we treat it that way.",
      },
    ],
  },
  cta: {
    h2: "The signals are already there. Let us build the system that hears them.",
    body: "Tell us what you need to watch, whether trucks, cold rooms, or machines. We will reply within one business day with a way to pilot it.",
    button: { label: "Discuss my IoT project", href: "/contact" },
  },
};
