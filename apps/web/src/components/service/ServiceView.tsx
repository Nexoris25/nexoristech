/**
 * Service-page template, ported from the approved design handoff service layout (breadcrumb,
 * hero with stats and media, problem quotes, what-we-build, AI features, process, proof,
 * where-we-build-it, FAQ, CTA). Data-driven so every service page shares one precise template.
 * Root carries .svc-page, scoping styles/service.css. Headings descend H1 -> H2 -> H3/H4 with no
 * skips; every image has descriptive alt text (PRD 15 + owner rules). The closing-CTA background
 * is decorative with empty alt by design; the hero media image is meaningful and described.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { ScrollFx } from "../home/ScrollFx.js";
import type { CaseStudyCard } from "../../lib/cms.js";
import { ContextualPhoto } from "../ContextualPhoto.js";
import type { ContextualImage } from "../../content/contextual-images.js";

/** The six delivery-stage icons, consistent across every page; only the copy varies per service. */
const STAGE_ICONS: ReactNode[] = [
  <>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.3-4.3" />
  </>,
  <path d="M12 19l7-7 3 3-7 7-3-3zM2 2l6 6M2 2l4 .8L6.8 8" key="d" />,
  <path d="M8 8l-4 4 4 4M16 8l4 4-4 4M13 6l-2 12" key="c" />,
  <>
    <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
    <path d="M9 12l2 2 4-4" />
  </>,
  <>
    <path d="M12 2c3 2 5 5 5 9a5 5 0 0 1-10 0c0-4 2-7 5-9z" />
    <path d="M9 16c-1 1-1.5 3-1.5 5M15 16c1 1 1.5 3 1.5 5" />
  </>,
  <>
    <path d="M21 12a9 9 0 1 1-3-6.7" />
    <path d="M21 4v4h-4" />
  </>,
];

export interface IconItem {
  icon: ReactNode;
  title: string;
  body: string;
}
export interface ServiceLink extends IconItem {
  href: string;
}

export interface ServiceContent {
  breadcrumb: string;
  hero: {
    kicker: string;
    h1: string;
    lede: string;
    primaryCta: { label: string; href: string };
    secondaryCta: { label: string; href: string };
    stats: { value: ReactNode; label: string }[];
    media?: { src: string; alt: string; chipTitle: string; chipSub: string };
  };
  /** Optional bespoke hero widget (e.g. the GEO platform-response widget); replaces the media image. */
  heroWidget?: ReactNode;
  problem: { kicker: string; h2: string; quotes: { text: string; tag?: string }[]; close: ReactNode };
  scope: { kicker: string; h2: string; lede?: ReactNode; items: IconItem[] };
  ai: { kicker: string; h2: string; intro: string; feats: IconItem[]; foot: string };
  process: {
    h2: string;
    steps?: { title: string; body: string }[];
    /** Delivery stages: title + description, with deliverables shown as compact pill tags. */
    stages?: { title: string; desc: string; activities?: string[]; deliverables?: string[] }[];
    note: ReactNode;
  };
  proof: { kicker: string; h2: string; lede: string; cards: { tag: string; title: string }[] };
  industryLinks: { kicker: string; h2: string; lede: string; links: ServiceLink[] };
  faq: { kicker: string; h2: string; lede: string; items: { q: string; a: string }[] };
  cta: { h2: string; body: string; button: { label: string; href: string }; media?: { src: string; alt: string } };
}

function Svg({ children }: { children: ReactNode }): ReactNode {
  return <svg viewBox="0 0 24 24">{children}</svg>;
}

export function ServiceView({ content, caseStudies = [], contextImage }: { content: ServiceContent; caseStudies?: CaseStudyCard[]; contextImage?: ContextualImage | undefined }): ReactNode {
  const c = content;
  return (
    <div className="svc-page">
      <ScrollFx />

      {/* HERO */}
      <section className="hero" aria-label="Hero">
        <div className="glow" />
        <div className="wrap">
          <nav className="crumb reveal" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span className="sep">/</span>
            <span className="here">{c.breadcrumb}</span>
          </nav>
          <div className="hero-grid">
            <div className="hero-inner reveal">
              <span className="kicker on-dark">
                <span className="dot" />
                {c.hero.kicker}
              </span>
              <h1>{c.hero.h1}</h1>
              <p className="lede">{c.hero.lede}</p>
              <div className="hero-cta">
                <Link className="btn btn-primary" href={c.hero.primaryCta.href}>
                  {c.hero.primaryCta.label} <span className="arr">&rarr;</span>
                </Link>
                <a className="btn btn-ghost on-dark" href={c.hero.secondaryCta.href}>
                  {c.hero.secondaryCta.label}
                </a>
              </div>
              {c.hero.stats.length > 0 ? (
                <div className="hero-stats">
                  {c.hero.stats.map((s, i) => (
                    <div className="hstat" key={i}>
                      <div className="hn">{s.value}</div>
                      <div className="hl">{s.label}</div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
            {c.heroWidget ? (
              <div className="service-demo"><p className="demo-caption">Interactive illustration · sample data</p>{c.heroWidget}</div>
            ) : c.hero.media ? (
              <div className="hero-media reveal">
                {/* .hero-media is position:relative with a fixed aspect ratio, so fill matches the existing
                    object-fit crop exactly. priority: it is the hero of the page. */}
                <Image src={c.hero.media.src} alt={c.hero.media.alt} fill sizes="(max-width: 1080px) 100vw, 46vw" style={{ objectFit: "cover" }} priority />
                <div className="ovl" />
                <div className="hero-chip">
                  <span className="hci">
                    <Svg>
                      <path d="M8 8l-4 4 4 4M16 8l4 4-4 4M13 6l-2 12" />
                    </Svg>
                  </span>
                  <span>
                    <b>{c.hero.media.chipTitle}</b>
                    <span>{c.hero.media.chipSub}</span>
                  </span>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="band" aria-label="The problem">
        <div className="wrap">
          <div className="band-head reveal">
            <span className="kicker">
              <span className="dot" />
              {c.problem.kicker}
            </span>
            <h2 className="h-section">{c.problem.h2}</h2>
          </div>
          <div className="pain-grid reveal">
            {c.problem.quotes.map((q, i) => (
              <article className="qcard" key={i}>
                <div className="qm">&ldquo;</div>
                <p>{q.text}</p>
                {q.tag ? <div className="qtag">{q.tag}</div> : null}
              </article>
            ))}
          </div>
          <p className="pain-close reveal">{c.problem.close}</p>
        </div>
      </section>

      {/* WHAT WE BUILD */}
      <section className="band soft" id="scope" aria-label="What we build">
        <div className="wrap">
          <div className="band-head reveal">
            <span className="kicker">
              <span className="dot" />
              {c.scope.kicker}
            </span>
            <h2 className="h-section">{c.scope.h2}</h2>
            {c.scope.lede ? <p className="lede">{c.scope.lede}</p> : null}
          </div>
          <div className="scope-editorial">
          {contextImage ? <ContextualPhoto image={contextImage} /> : null}
          <div className="cover reveal">
            {c.scope.items.map((it, i) => (
              <div className="cv" key={i}>
                <span className="ic">
                  <Svg>{it.icon}</Svg>
                </span>
                <div>
                  <h3>{it.title}</h3>
                  <p>{it.body}</p>
                </div>
              </div>
            ))}
          </div>
          </div>
        </div>
      </section>

      {/* AI FEATURES */}
      <section className="ai-band" aria-label="AI features">
        <div className="glow" />
        <div className="wrap">
          <div className="ai-inner reveal">
            <div className="ai-top">
              <div className="ai-copy">
                <span className="kicker on-dark">
                  <span className="dot" />
                  {c.ai.kicker}
                </span>
                <h2>{c.ai.h2}</h2>
                <p>{c.ai.intro}</p>
              </div>
            </div>
            <div className={`ai-feats${c.ai.feats.length === 4 ? " ai-feats-4" : ""}`}>
              {c.ai.feats.map((f, i) => (
                <article className="afeat" key={i}>
                  <span className="ai-ic">
                    <Svg>{f.icon}</Svg>
                  </span>
                  <h3>{f.title}</h3>
                  <p>{f.body}</p>
                </article>
              ))}
            </div>
            <div className="ai-foot reveal">
              <span className="chk">
                <Svg>
                  <path d="M4 12l5 5L20 6" />
                </Svg>
              </span>
              {c.ai.foot}
            </div>
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section className="band" id="process" aria-label="How it runs">
        <div className="wrap">
          <div className="band-head reveal">
            <span className="kicker">
              <span className="dot" />
              How we work
            </span>
            <h2 className="h-section">{c.process.h2}</h2>
          </div>
          {c.process.stages ? (
            <div className="dstages reveal">
              {c.process.stages.map((st, i) => (
                <div className="dstage" key={i}>
                  <span className="dstage-num">{String(i + 1).padStart(2, "0")}</span>
                  <h3>{st.title}</h3>
                  <p>{st.desc}</p>
                  {st.deliverables && st.deliverables.length > 0 ? (
                    <>
                      <div className="dstage-label">Deliverables</div>
                      <div className="dstage-pills">
                        {st.deliverables.map((d) => (
                          <span key={d}>{d}</span>
                        ))}
                      </div>
                    </>
                  ) : null}
                </div>
              ))}
            </div>
          ) : c.process.steps ? (
            <div
              className={`proc-grid reveal${
                c.process.steps.length === 4
                  ? " proc-grid-4"
                  : c.process.steps.length === 2
                    ? " proc-grid-2"
                    : ""
              }`}
            >
              {c.process.steps.map((s, i) => (
                <div className="pstep" key={i}>
                  <span className="pnode">
                    <span className="pn-badge">{String(i + 1).padStart(2, "0")}</span>
                    <Svg>{STAGE_ICONS[i]}</Svg>
                  </span>
                  <div className="pnum">Stage {String(i + 1).padStart(2, "0")}</div>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </div>
              ))}
            </div>
          ) : null}
          <div className="proc-note reveal">
            <span className="pn-ic">
              <Svg>
                <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
                <path d="M9 12l2 2 4-4" />
              </Svg>
            </span>
            <div>
              <p>{c.process.note}</p>
              <Link className="link-arrow" href="/how-we-work">
                See the full approach <span className="arr">&rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* PROOF
          The section used to render fixed cards carrying a line that read "Verified project card ·
          loaded from case studies" — a description of what it was meant to do, sitting on the page as
          though it were the work, with every card linking to the index rather than to a project. It now
          renders the case studies that name this service, and when none do, it does not render at all.
          A service page with no proof yet is honest; a proof section with no proof in it is not. */}
      {caseStudies.length > 0 ? (
      <section className="band soft" id="proof" aria-label="Proof">
        <div className="wrap">
          <div className="band-head reveal">
            <span className="kicker">
              <span className="dot" />
              {c.proof.kicker}
            </span>
            <h2 className="h-section">{c.proof.h2}</h2>
            <p className="lede">{c.proof.lede}</p>
          </div>
          <div className="proof-grid reveal">
            {caseStudies.map((study) => (
              <Link className="proof-card" href={`/case-studies/${study.slug}`} key={study.slug}>
                {study.coverUrl ? (
                  <span className="pc-shot">
                    <img src={study.coverUrl} alt={study.coverAlt ?? ""} loading="lazy" />
                  </span>
                ) : (
                  <span className="pc-shot pc-shot-none" aria-hidden="true" />
                )}
                <span className="pc-body">
                  {study.industry ? <span className="pc-tag">{study.industry}</span> : null}
                  <h3>{study.title}</h3>
                  {study.summary ? <span className="pc-sum">{study.summary}</span> : null}
                  <span className="pc-go">Read the case study <span className="arr">&rarr;</span></span>
                </span>
              </Link>
            ))}
          </div>
          <div className="proof-foot reveal">
            <Link className="link-arrow" href="/case-studies">
              See the work <span className="arr">&rarr;</span>
            </Link>
          </div>
        </div>
      </section>
      ) : null}

      {/* WHERE WE BUILD IT */}
      <section className="band" id="industries-links" aria-label="Where we build it">
        <div className="wrap">
          <div className="band-head reveal">
            <span className="kicker">
              <span className="dot" />
              {c.industryLinks.kicker}
            </span>
            <h2 className="h-section">{c.industryLinks.h2}</h2>
            <p className="lede">{c.industryLinks.lede}</p>
          </div>
          <div className="cover reveal">
            {c.industryLinks.links.map((l, i) => (
              <Link className="cv" href={l.href} key={i}>
                <span className="ic">
                  <Svg>{l.icon}</Svg>
                </span>
                <div>
                  <h3>
                    {l.title} <span className="arr">&rarr;</span>
                  </h3>
                  <p>{l.body}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="band soft" id="faq" aria-label="FAQ">
        <div className="wrap">
          <div className="faq-head reveal">
            <span className="kicker">
              <span className="dot" />
              {c.faq.kicker}
            </span>
            <h2>{c.faq.h2}</h2>
            <p className="lede">{c.faq.lede}</p>
          </div>
          <div className="faq-wrap reveal">
            {c.faq.items.map((f, i) => (
              <details className="faq" key={i}>
                <summary>
                  {f.q} <span className="fq-pm">+</span>
                </summary>
                <div className="faq-a">{f.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CLOSING CTA */}
      <section className="cta" id="cta" aria-label="Closing CTA">
        {c.cta.media ? (
          <div className="photo">
            <Image src={c.cta.media.src} alt={c.cta.media.alt} fill sizes="100vw" style={{ objectFit: "cover" }} />
          </div>
        ) : null}
        <div className="glow" />
        <div className="wrap cta-inner reveal">
          <h2>{c.cta.h2}</h2>
          <p>{c.cta.body}</p>
          <Link className="btn btn-primary" href={c.cta.button.href}>
            {c.cta.button.label} <span className="arr">&rarr;</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
