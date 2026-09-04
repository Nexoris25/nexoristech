/**
 * Case Studies hub, transcribed from the approved design handoff (Case Studies.html): a compact
 * centered hero, an honest "verified figures only" grid (placeholders until a client approves real
 * results, never fabricated), the two real in-house products (Covyvo and GLEEN, shown with genuine
 * product screenshots), and the "how we tell each story" steps. The outbound Covyvo/GLEEN links are
 * intentionally omitted until those sites are live (content module note, PRD 1.7). Rendered inside
 * .svc-page.case-studies-page; ScrollFx adds reveals.
 */
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ScrollFx } from "../home/ScrollFx.js";
import { CaseStudyGrid } from "./CaseStudyGrid.js";
import type { CaseStudyCard } from "../../lib/cms.js";

const PLACEHOLDERS = [
  "The headline result, stated plainly, appears here.",
  "A client situation that looked like yours before we started.",
  "What changed, in numbers we can stand behind.",
];

const STORY_STEPS = [
  {
    n: "01",
    title: "Where they started",
    body: "The situation in the client's own words: what was slow, manual, or leaking money.",
  },
  {
    n: "02",
    title: "What we agreed to build",
    body: "The scope, in plain words, and the outcome both sides signed up to.",
  },
  {
    n: "03",
    title: "How it went",
    body: "The build, the stages, and what changed along the way, told honestly.",
  },
  {
    n: "04",
    title: "What changed",
    body: "A metrics grid of verified figures only. If a number cannot be stood behind, it does not appear.",
  },
];

export function CaseStudiesView({ studies = [] }: { studies?: CaseStudyCard[] }): ReactNode {
  return (
    <div className="svc-page case-studies-page">
      <ScrollFx />

      {/* HERO */}
      <section className="hero" aria-label="Case studies">
        <div className="glow" />
        <div className="wrap">
          <nav className="crumb reveal" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span className="sep">/</span>
            <span className="here">Case Studies</span>
          </nav>
          <div className="hero-inner reveal">
            <span className="kicker on-dark">
              <span className="dot" />
              Our work
            </span>
            <h1>The work, with the numbers attached.</h1>
            <p className="lede">
              Every project here shipped against agreed outcomes. Filter by industry or service to
              find a business that looked like yours before we started.
            </p>
          </div>
        </div>
      </section>

      {/* GRID */}
      <section className="band" aria-label="Client projects">
        <div className="wrap">
          <div className="band-head reveal">
            <span className="kicker">
              <span className="dot" />
              Client projects
            </span>
            <h2 className="h-section">Filter the work to find your situation.</h2>
          </div>
          {/* The published work. The placeholders below were written for the case of having none yet,
              and that is the only case they still serve — they used to show even when the CMS held
              real case studies, because nothing read from it. */}
          {studies.length > 0 ? (
            <CaseStudyGrid studies={studies} />
          ) : (
            <>
              <div className="cs-toolbar reveal">
                <span />
                <span className="cs-count">Verified figures only</span>
              </div>
              <div className="cs-grid reveal">
                {PLACEHOLDERS.map((h) => (
                  <article className="cs-ph" key={h}>
                    <div className="ph-stripe" />
                    <span className="ph-tag">Verified case study</span>
                    <h3>{h}</h3>
                    <div className="ph-meta">Industry &middot; Service &middot; Outcome</div>
                  </article>
                ))}
              </div>
              {/* This note explains an empty grid ("this space stays honest rather than filled"), so it
                  belongs with the empty grid and not under real work. */}
              <div className="cs-note">
                <div className="cn-ic">
                  <svg viewBox="0 0 24 24">
                    <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                </div>
                <p>
                  Client case studies are published here only when the outcome is verified and the
                  client has approved the figures.{" "}
                  <b>If a number cannot be stood behind, it does not appear.</b> Until a
                  project&rsquo;s results are confirmed, this space stays honest rather than filled.
                  Our two in-house products below are real proof of capability you can look at today.
                </p>
              </div>
            </>
          )}
        </div>
      </section>

      {/* IN-HOUSE PRODUCTS */}
      <section className="band soft" aria-label="Our own products">
        <div className="wrap">
          <div className="band-head reveal">
            <span className="kicker">
              <span className="dot" />
              Our own products
            </span>
            <h2 className="h-section">We also build our own products.</h2>
            <p className="lede">
              When we build for ourselves, we feel every shortcut. So we do not take them, for us or
              for you. These two products run on the same process, tools, and standards as every
              client project.
            </p>
          </div>
          <div className="ih-grid reveal">
            <article className="ih-card">
              <div className="ih-shot">
                <span className="ih-badge">Product screenshot</span>
                <Image
                  src="/case-studies/covyvo-dashboard.webp"
                  alt="The Covyvo dashboard showing revenue, expenses, payroll cost, and compliance alerts for a Nigerian small business"
                  fill
                  sizes="(max-width: 760px) 100vw, 46vw"
                />
              </div>
              <div className="ih-body">
                <div className="ih-head">
                  <Image className="ih-logo-img" src="/case-studies/covyvo-logo.webp" alt="Covyvo" width={860} height={120} />
                </div>
                <div className="ih-tag">Payroll, e-invoicing &amp; core business tools</div>
                <p>
                  Covyvo brings payroll, e-invoicing, and the everyday tools a business runs on into
                  one platform, built for small and medium businesses in Nigeria.
                </p>
                <p>
                  The Nigeria Tax Act 2025 changed the compliance rules, and most SME tools have not
                  caught up, so we built one that has. Covyvo handles payroll around current Nigerian
                  tax and statutory requirements, and e-invoicing designed for the new rules, all on
                  a subscription with no large upfront cost.
                </p>
                <div className="ih-meta">
                  <span className="ih-chip">Payroll</span>
                  <span className="ih-chip">E-invoicing</span>
                  <span className="ih-chip">Tax Act 2025</span>
                </div>
                <div className="ih-foot">
                  <div className="ehint">Under active development &middot; early access is open</div>
                </div>
              </div>
            </article>

            <article className="ih-card">
              <div className="ih-shot contain">
                <span className="ih-badge">Product screenshot</span>
                <Image
                  src="/case-studies/gleen-app.webp"
                  alt="The GLEEN mobile app home screen showing study progress, subject categories, and a WAEC mock exam"
                  fill
                  sizes="(max-width: 760px) 100vw, 46vw"
                />
              </div>
              <div className="ih-body">
                <div className="ih-head">
                  <Image className="ih-logo-img gleen" src="/case-studies/gleen-logo.webp" alt="GLEEN" width={354} height={140} />
                </div>
                <div className="ih-tag">Gamified exam preparation for Nigerian students</div>
                <p>
                  GLEEN is a gamified learning platform for students sitting WAEC, NECO, JAMB, and
                  Post-UTME. Users take on their friends in one-on-one quiz battles, join study
                  crews, and earn XP for completing a course or winning a challenge.
                </p>
                <p>
                  That XP can be withdrawn as airtime, so the reward is real. The gamification is
                  designed to make studying something students actually want to come back to,
                  instead of a struggle they put off until the week before.
                </p>
                <div className="ih-meta">
                  <span className="ih-chip">1v1 quiz battles</span>
                  <span className="ih-chip">Study crews</span>
                  <span className="ih-chip">XP as airtime</span>
                  <span className="ih-chip">WAEC / JAMB</span>
                </div>
                <div className="ih-foot">
                  <div className="ehint">Under active development &middot; early access is open</div>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* HOW WE TELL EACH STORY */}
      <section className="band" aria-label="What each case study covers">
        <div className="wrap">
          <div className="band-head reveal">
            <span className="kicker">
              <span className="dot" />
              What you will read
            </span>
            <h2 className="h-section">How we tell each story.</h2>
            <p className="lede">
              Every entry follows the same honest structure, told plainly from the situation to the
              result.
            </p>
          </div>
          <div className="det reveal">
            {STORY_STEPS.map((s) => (
              <article className="det-step" key={s.n}>
                <div className="ds-n">{s.n}</div>
                {/* H3, under the section's H2. These were H4s, which skipped a level: a reader
                    using headings to navigate hears "How we tell each story" and then a jump two
                    ranks down, and the outline it builds has a hole where the H3 should be. The
                    size is set in CSS, so the rank is free to be correct. */}
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta" aria-label="Closing CTA">
        <div className="glow" />
        <div className="wrap cta-inner reveal">
          <h2>Your project could be the one at the top of this page next year.</h2>
          <p>Tell us what you are trying to achieve, and we will map the route to it.</p>
          <Link className="btn btn-primary" href="/contact">
            Start a project <span className="arr">&rarr;</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
