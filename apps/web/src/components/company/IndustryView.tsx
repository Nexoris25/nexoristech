/**
 * One brand-consistent industry page, rendered from any industry content module (routeClass
 * "industry"). It lays out the editorial template used across all 20 industries: a centered dark
 * hero, editorial pain quotes, a numbered "what we build" list, a dark "where AI helps" grid, an
 * outcomes prose block, "built with these services" links, and the FAQ. Uses only brand tokens (no
 * per-industry accent colours). Proof/case-study sections are data-driven and omitted here until a
 * client approves real figures (no fabricated testimonials). Server component; ScrollFx adds reveals.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { ScrollFx } from "../home/ScrollFx.js";
import type { MarketingPage, Section } from "../../content/types.js";

/** All 11 services, with a keyword to resolve the free-text "Built with these services" notes. */
const SERVICES: { key: RegExp; title: string; href: string; blurb: string; icon: ReactNode }[] = [
  {
    key: /product development|custom software|websites?, apps/i,
    title: "AI Product Development",
    href: "/ai-product-development",
    blurb: "Custom websites, web apps, mobile apps, and business systems built around how you work.",
    icon: (
      <>
        <path d="M4 7l8-4 8 4-8 4z" />
        <path d="M4 7v10l8 4 8-4V7" />
        <path d="M12 11v10" />
      </>
    ),
  },
  {
    key: /chatbot|assistant/i,
    title: "AI Chatbots & Virtual Assistants",
    href: "/ai-chatbots-virtual-assistants",
    blurb: "Assistants that answer from your own content and hand off to a human when needed.",
    icon: (
      <>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <path d="M8 9h8M8 12h5" />
      </>
    ),
  },
  {
    key: /automation|process/i,
    title: "Business Process Automation",
    href: "/business-process-automation",
    blurb: "Automate the repetitive, manual workflows quietly eating your team's hours.",
    icon: (
      <>
        <circle cx="12" cy="12" r="3.2" />
        <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
      </>
    ),
  },
  {
    key: /e-?commerce/i,
    title: "AI E-Commerce",
    href: "/ai-ecommerce-development",
    blurb: "Online stores built around your catalogue, with payments and renewals handled.",
    icon: (
      <>
        <path d="M3 4h2l2.2 11.2a1.5 1.5 0 0 0 1.5 1.2h8.1a1.5 1.5 0 0 0 1.5-1.2L21 7H6" />
        <circle cx="9" cy="20" r="1.4" />
        <circle cx="18" cy="20" r="1.4" />
      </>
    ),
  },
  {
    key: /dashboard|analytics/i,
    title: "Data Dashboards & Analytics",
    href: "/data-dashboards-predictive-analytics",
    blurb: "Your numbers in one live view, with forecasts you can actually act on.",
    icon: <path d="M4 19V5M4 19h16M8 16V9M12 16v-5M16 16v-9" />,
  },
  {
    key: /integration|systems/i,
    title: "AI & Systems Integration",
    href: "/ai-systems-integration",
    blurb: "Connect the tools and data you already use so they finally talk to each other.",
    icon: (
      <>
        <circle cx="6" cy="12" r="2.5" />
        <circle cx="18" cy="6" r="2.5" />
        <circle cx="18" cy="18" r="2.5" />
        <path d="M8 11l8-4M8 13l8 4" />
      </>
    ),
  },
  {
    key: /infrastructure|readiness/i,
    title: "Data Infrastructure & AI Readiness",
    href: "/data-infrastructure-ai-readiness",
    blurb: "Clean, structured, well-governed data, the groundwork everything else needs.",
    icon: (
      <>
        <ellipse cx="12" cy="6" rx="8" ry="3" />
        <path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
      </>
    ),
  },
  {
    key: /iot/i,
    title: "IoT Development",
    href: "/iot-development",
    blurb: "Sensors and connected devices that report what is happening on the ground.",
    icon: (
      <>
        <rect x="7" y="7" width="10" height="10" rx="2" />
        <path d="M10 3v2M14 3v2M10 19v2M14 19v2M3 10h2M3 14h2M19 10h2M19 14h2" />
      </>
    ),
  },
  {
    key: /govtech|government/i,
    title: "GovTech Platforms",
    href: "/govtech-platforms",
    blurb: "Citizen services, registries, and revenue platforms built for institutions.",
    icon: <path d="M3 9l9-5 9 5M5 9v9M19 9v9M9 18v-6M15 18v-6M3 21h18" />,
  },
  {
    key: /seo|geo|content/i,
    title: "AI Content, SEO & GEO",
    href: "/ai-seo-geo",
    blurb: "Get found on Google and surfaced inside AI tools when customers search.",
    icon: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.3-4.3" />
      </>
    ),
  },
  {
    key: /managed|operations/i,
    title: "Managed Technology Operations",
    href: "/managed-technology-operations",
    blurb: "We keep it running, monitored, and improving long after launch.",
    icon: (
      <>
        <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
        <path d="M9 12l2 2 4-4" />
      </>
    ),
  },
];

/** Resolve the "Built with these services" note into ordered, de-duplicated service links. */
function resolveServices(note: string): typeof SERVICES {
  const after = note.replace(/^[^:]*:/, "");
  const picked: typeof SERVICES = [];
  for (const part of after.split(",")) {
    const svc = SERVICES.find((s) => s.key.test(part));
    if (svc && !picked.includes(svc)) picked.push(svc);
  }
  return picked.length > 0 ? picked : SERVICES.slice(0, 6);
}

/** Short industry label for the breadcrumb, from the meta title. */
function industryLabel(title: string): string {
  return (title.split("|")[0] ?? "Industry").replace(/\bin Nigeria\b/i, "").trim();
}

function renderSection(section: Section): ReactNode {
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
              <div className="ind-pain-row" key={c.body}>
                <span className="pn">{String(i + 1).padStart(2, "0")}</span>
                <p className="pq">&ldquo;{c.body}&rdquo;</p>
              </div>
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
            {section.cards.map((c, i) => (
              <div className="ind-sol-item" key={(c.title ?? "") + c.body}>
                <span className="sn">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  {c.title ? <h3>{c.title.replace(/\.$/, "")}</h3> : null}
                  <p>{c.body}</p>
                </div>
              </div>
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
                  <svg viewBox="0 0 24 24">{s.icon}</svg>
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
  return (
    <div className="svc-page industry-page">
      <ScrollFx />

      <section className="hero" aria-label={industryLabel(meta.title)}>
        <div className="glow" />
        <div className="wrap">
          <nav className="crumb reveal" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span className="sep">/</span>
            <Link href="/#industries">Industries</Link>
            <span className="sep">/</span>
            <span className="here">{industryLabel(meta.title)}</span>
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
              <Link className="btn btn-ghost on-dark" href="/#finder">
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

      {page.sections.map((section) => renderSection(section))}
    </div>
  );
}
