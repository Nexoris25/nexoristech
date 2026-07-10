/**
 * One brand-consistent industry page, rendered from any industry content module (routeClass
 * "industry"). It lays out the editorial template used across all 20 industries: a centered dark
 * hero, premium "problem" cards (with an industry-aligned icon set), redesigned "what we build"
 * cards, a live per-industry service finder, a dark "where AI helps" grid, an outcomes prose block,
 * "built with these services" links, and the FAQ. Uses only brand tokens (no per-industry accent
 * colours). Every industry's service list always includes AI Content, SEO & GEO because every
 * industry needs to be found. Proof/case-study sections are data-driven and omitted here until a
 * client approves real figures (no fabricated testimonials). ScrollFx adds reveals.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { ScrollFx } from "../home/ScrollFx.js";
import { ICONS } from "./industryIcons.js";
import { SolutionFinder } from "../SolutionFinder.js";
import { isIndustrySlug } from "@nexoris/recommend";
import type { MarketingPage, Section } from "../../content/types.js";

interface Service {
  key: RegExp;
  title: string;
  href: string;
  blurb: string;
  iconKey: string;
}

/** All 11 services, with a keyword to resolve the free-text "Built with these services" notes. */
const SERVICES: Service[] = [
  {
    key: /product development|custom software|websites?, apps/i,
    title: "AI Product Development",
    href: "/ai-product-development",
    blurb: "Custom websites, web apps, mobile apps, and business systems built around how you work.",
    iconKey: "cube",
  },
  {
    key: /chatbot|assistant/i,
    title: "AI Chatbots & Virtual Assistants",
    href: "/ai-chatbots-virtual-assistants",
    blurb: "Assistants that answer from your own content and hand off to a human when needed.",
    iconKey: "chat",
  },
  {
    key: /automation|process/i,
    title: "Business Process Automation",
    href: "/business-process-automation",
    blurb: "Automate the repetitive, manual workflows quietly eating your team's hours.",
    iconKey: "gear",
  },
  {
    key: /e-?commerce/i,
    title: "AI E-Commerce",
    href: "/ai-ecommerce-development",
    blurb: "Online stores built around your catalogue, with payments and renewals handled.",
    iconKey: "cart",
  },
  {
    key: /dashboard|analytics/i,
    title: "Data Dashboards & Analytics",
    href: "/data-dashboards-predictive-analytics",
    blurb: "Your numbers in one live view, with forecasts you can actually act on.",
    iconKey: "chart",
  },
  {
    key: /integration|systems/i,
    title: "AI & Systems Integration",
    href: "/ai-systems-integration",
    blurb: "Connect the tools and data you already use so they finally talk to each other.",
    iconKey: "nodes",
  },
  {
    key: /infrastructure|readiness/i,
    title: "Data Infrastructure & AI Readiness",
    href: "/data-infrastructure-ai-readiness",
    blurb: "Clean, structured, well-governed data, the groundwork everything else needs.",
    iconKey: "db",
  },
  {
    key: /iot/i,
    title: "IoT Development",
    href: "/iot-development",
    blurb: "Sensors and connected devices that report what is happening on the ground.",
    iconKey: "sensor",
  },
  {
    key: /govtech|government/i,
    title: "GovTech Platforms",
    href: "/govtech-platforms",
    blurb: "Citizen services, registries, and revenue platforms built for institutions.",
    iconKey: "bank",
  },
  {
    key: /seo|geo|content|found/i,
    title: "AI Content, SEO & GEO",
    href: "/ai-seo-geo",
    blurb: "Get found on Google and surfaced inside AI tools when customers search.",
    iconKey: "search",
  },
  {
    key: /managed|operations/i,
    title: "Managed Technology Operations",
    href: "/managed-technology-operations",
    blurb: "We keep it running, monitored, and improving long after launch.",
    iconKey: "shield",
  },
];

const SEO_SERVICE = SERVICES.find((s) => s.href === "/ai-seo-geo") as Service;

/**
 * Resolve the "Built with these services" note into ordered, de-duplicated service links. AI
 * Content, SEO & GEO is always appended (if not already named) because every industry needs to be
 * found on Google and inside AI tools.
 */
function resolveServices(note: string): Service[] {
  const after = note.replace(/^[^:]*:/, "");
  const picked: Service[] = [];
  for (const part of after.split(",")) {
    const svc = SERVICES.find((s) => s.key.test(part));
    if (svc && !picked.includes(svc)) picked.push(svc);
  }
  if (picked.length === 0) picked.push(...SERVICES.slice(0, 5));
  if (!picked.includes(SEO_SERVICE)) picked.push(SEO_SERVICE);
  return picked;
}

/** Per-industry glyph set for the "problem" cards, so each page's variant matches its sector. */
const PAIN_ICONS: Record<string, string[]> = {
  "agritech-software": ["leaf", "cloud", "shield", "coins"],
  "automotive-software": ["car", "wrench", "calendar", "coins"],
  "church-management-software": ["church", "users", "calendar", "heart"],
  "construction-software": ["hardhat", "ruler", "truck", "chart"],
  "education-software": ["book", "users", "screen", "chart"],
  "events-software": ["calendar", "ticket", "users", "camera"],
  "fintech-software": ["coins", "shield", "chart", "phone"],
  "fitness-wellness-software": ["dumbbell", "calendar", "heart", "users"],
  "government-digital-solutions": ["bank", "doc", "users", "shield"],
  "healthcare-software": ["pulse", "stethoscope", "calendar", "shield"],
  "hospitality-software": ["home", "calendar", "star", "users"],
  "insurance-software": ["shield", "doc", "scale", "chart"],
  "logistics-software": ["truck", "box", "pin", "gauge"],
  "manufacturing-software": ["factory", "gauge", "box", "wrench"],
  "media-entertainment-software": ["play", "camera", "users", "chart"],
  "ngo-software": ["heart", "users", "doc", "coins"],
  "professional-services-software": ["briefcase", "doc", "clock", "users"],
  "real-estate-software": ["home", "key", "users", "chart"],
  "restaurant-software": ["utensils", "cart", "clock", "users"],
  "retail-ecommerce-software": ["cart", "tag", "box", "chart"],
};
const PAIN_FALLBACK = ["gauge", "chart", "shield", "users"];

function painIcon(slug: string, index: number): string {
  const set = PAIN_ICONS[slug] ?? PAIN_FALLBACK;
  return set[index % set.length] ?? "gauge";
}

/** Choose a "what we build" card icon from keywords in the solution title. */
const SOLUTION_ICON_RULES: { re: RegExp; icon: string }[] = [
  { re: /marketplace|market\b|store|shop/i, icon: "cart" },
  { re: /credit|pay|loan|invoice|billing|payment|wallet|finance/i, icon: "coins" },
  { re: /traceab|complian|audit|record|certif/i, icon: "shield" },
  { re: /offline|field|mobile|app\b/i, icon: "phone" },
  { re: /portal|website|site\b|booking/i, icon: "screen" },
  { re: /dashboard|report|analytic|forecast/i, icon: "chart" },
  { re: /sensor|iot|device|telemetr|track/i, icon: "sensor" },
  { re: /integrat|connect|sync|api/i, icon: "nodes" },
  { re: /automation|automate|workflow|schedul/i, icon: "gear" },
  { re: /calendar|appointment|reservation|event/i, icon: "calendar" },
  { re: /data|database|infrastructure|warehouse/i, icon: "db" },
  { re: /member|customer|patient|student|donor|citizen|guest|tenant|crm/i, icon: "users" },
  { re: /content|seo|search/i, icon: "search" },
  { re: /manage|admin|operations|scheme/i, icon: "grid" },
];

function solutionIcon(title: string): string {
  for (const rule of SOLUTION_ICON_RULES) {
    if (rule.re.test(title)) return rule.icon;
  }
  return "cube";
}

/** Short industry label for the breadcrumb, from the meta title. */
function industryLabel(title: string): string {
  return (title.split("|")[0] ?? "Industry").replace(/\bin Nigeria\b/i, "").trim();
}

function renderSection(section: Section, slug: string): ReactNode {
  if (section.kind === "cards" && section.id === "pain") {
    return (
      <section className="band" aria-label="The problem" key={section.id}>
        <div className="wrap">
          <div className="band-head reveal">
            <span className="kicker">
              <span className="dot" />
              The problem
            </span>
            {section.heading ? <h2 className="h-section">{section.heading}</h2> : null}
          </div>
          <div className="ind-pain reveal">
            {section.cards.map((c, i) => (
              <article className="ind-pain-card" key={c.body}>
                <div className="ind-pain-top">
                  <span className="ind-pain-ic">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      {ICONS[painIcon(slug, i)] ?? ICONS.gauge}
                    </svg>
                  </span>
                  <span className="ind-pain-n">{String(i + 1).padStart(2, "0")}</span>
                </div>
                <p className="ind-pain-q">&ldquo;{c.body}&rdquo;</p>
              </article>
            ))}
          </div>
          {section.closingLine ? <p className="ind-pclose reveal">{section.closingLine}</p> : null}
        </div>
      </section>
    );
  }

  if (section.kind === "cards" && section.id === "solutions") {
    return (
      <section className="band soft" aria-label="What we build" key={section.id}>
        <div className="wrap">
          <div className="band-head reveal">
            <span className="kicker">
              <span className="dot" />
              What we build
            </span>
            {section.heading ? <h2 className="h-section">{section.heading}</h2> : null}
            {section.intro ? <p className="lede">{section.intro}</p> : null}
          </div>
          <div className="ind-sol reveal">
            {section.cards.map((c) => (
              <article className="ind-sol-card" key={(c.title ?? "") + c.body}>
                <span className="ind-sol-ic">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    {ICONS[solutionIcon(c.title ?? c.body)] ?? ICONS.cube}
                  </svg>
                </span>
                {c.title ? <h3>{c.title.replace(/\.$/, "")}</h3> : null}
                <p>{c.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (section.kind === "cards" && section.id.startsWith("ai")) {
    return (
      <section className="band ink" aria-label="Where AI helps" key={section.id}>
        <div className="wrap">
          <div className="band-head reveal">
            <span className="kicker on-dark">
              <span className="dot" />
              Where AI helps
            </span>
            {section.heading ? (
              <h2 className="h-section" style={{ color: "#fff" }}>
                {section.heading}
              </h2>
            ) : null}
            {section.intro ? (
              <p className="lede" style={{ color: "rgba(255,255,255,.72)" }}>
                {section.intro}
              </p>
            ) : null}
          </div>
          <div className="ind-ai-grid reveal">
            {section.cards.map((c) => (
              <div className="ind-ai-row" key={(c.title ?? "") + c.body}>
                <span className="ri">
                  <svg viewBox="0 0 24 24">
                    <path d="M12 3l1.9 4.6L19 9l-4.6 1.9L12 16l-1.9-4.6L5 9l5.1-1.4z" />
                  </svg>
                </span>
                <div>
                  {c.title ? <b>{c.title.replace(/\.$/, "")}</b> : null}
                  <p>{c.body}</p>
                </div>
              </div>
            ))}
          </div>
          {section.closingLine ? (
            <div className="ind-ai-note reveal">
              <span className="ck">
                <svg viewBox="0 0 24 24">
                  <path d="M4 12l5 5L20 6" />
                </svg>
              </span>
              <p>{section.closingLine}</p>
            </div>
          ) : null}
        </div>
      </section>
    );
  }

  if (section.kind === "rich" && section.id === "outcomes") {
    return (
      <section className="band" aria-label="What changes" key={section.id}>
        <div className="wrap">
          <div className="band-head reveal">
            <span className="kicker">
              <span className="dot" />
              What changes
            </span>
            {section.heading ? <h2 className="h-section">{section.heading}</h2> : null}
          </div>
          <div className="ind-out reveal">
            {(section.body ?? []).map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (section.kind === "dynamic" && section.id === "services-links") {
    const services = resolveServices(section.note);
    return (
      <section className="band soft" aria-label="Built with these services" key={section.id}>
        <div className="wrap">
          <div className="band-head reveal">
            <span className="kicker">
              <span className="dot" />
              Built with these services
            </span>
            {section.heading ? <h2 className="h-section">{section.heading}</h2> : null}
          </div>
          <div className="ind-svc reveal">
            {services.map((s) => (
              <Link className="ind-svc-a" href={s.href} key={s.href}>
                <span className="si">
                  <svg viewBox="0 0 24 24">{ICONS[s.iconKey] ?? ICONS.cube}</svg>
                </span>
                <span>
                  <b>{s.title}</b>
                  <span>{s.blurb}</span>
                </span>
                <span className="arr" aria-hidden="true">
                  &rarr;
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (section.kind === "faq") {
    return (
      <section className="band" id="faq" aria-label="Frequently asked questions" key={section.id}>
        <div className="wrap">
          <div className="faq-head reveal">
            <span className="kicker">
              <span className="dot" />
              Questions
            </span>
            <h2>{section.heading}</h2>
          </div>
          <div className="faq-wrap reveal">
            {section.items.map((f) => (
              <details className="faq" key={f.question}>
                <summary>
                  {f.question} <span className="fq-pm">+</span>
                </summary>
                <div className="faq-a">{f.answer}</div>
              </details>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (section.kind === "cta-band") {
    return (
      <section className="cta" aria-label="Closing call to action" key={section.id}>
        <div className="glow" />
        <div className="wrap cta-inner reveal">
          <h2>{section.heading}</h2>
          {section.body ? <p>{section.body}</p> : null}
          <Link className="btn btn-primary" href={section.button.href}>
            {section.button.label} <span className="arr">&rarr;</span>
          </Link>
        </div>
      </section>
    );
  }

  // proof / proof-cards and any other dynamic sections are data-driven; omitted until real data.
  return null;
}

export function IndustryView({ page }: { page: MarketingPage }): ReactNode {
  const { hero, meta } = page;
  const slug = meta.slug.replace(/^\//, "");
  const label = industryLabel(meta.title);
  // Lock the shared Solution Finder to this industry so it keeps the homepage pattern and standard.
  const lockedIndustry = isIndustrySlug(slug) ? slug : undefined;

  const body: ReactNode[] = [];
  for (const section of page.sections) {
    const node = renderSection(section, slug);
    if (node) body.push(node);
    // Drop the same Solution Finder used on the homepage in right after "what we build",
    // where the hero's "Find the right service" CTA lands. The industry is fixed here.
    if (section.kind === "cards" && section.id === "solutions") {
      body.push(
        <section className="band" id="solution-finder" aria-label="Service finder" key="finder">
          <div className="wrap">
            <div className="band-head reveal">
              <span className="kicker">
                <span className="dot" />
                Service finder
              </span>
              <h2 className="h-section">Not sure which service fits? Let us point you.</h2>
              <p className="lede">
                Answer a couple of quick questions and we will suggest the right service to start
                with, plus honest next steps.
              </p>
            </div>
            <SolutionFinder {...(lockedIndustry ? { lockedIndustry } : {})} />
          </div>
        </section>,
      );
    }
  }

  return (
    <div className="svc-page industry-page">
      <ScrollFx />

      <section className="hero" aria-label={label}>
        <div className="glow" />
        <div className="wrap">
          <nav className="crumb reveal" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span className="sep">/</span>
            <Link href="/#industries">Industries</Link>
            <span className="sep">/</span>
            <span className="here">{label}</span>
          </nav>
          <div className="hero-inner reveal">
            <span className="kicker on-dark">
              <span className="dot" />
              Industry
            </span>
            <h1>{hero.h1}</h1>
            {hero.subline ? <p className="lede">{hero.subline}</p> : null}
            <div className="hero-cta">
              <Link className="btn btn-primary" href={hero.primaryCta?.href ?? "/contact"}>
                {hero.primaryCta?.label ?? "Talk to us"} <span className="arr">&rarr;</span>
              </Link>
              <Link className="btn btn-ghost on-dark" href="#solution-finder">
                Find the right service
              </Link>
            </div>
            {hero.trustStrip ? (
              <span className="hero-meta">
                <span className="hb" />
                {hero.trustStrip}
              </span>
            ) : null}
          </div>
        </div>
      </section>

      {body}
    </div>
  );
}
