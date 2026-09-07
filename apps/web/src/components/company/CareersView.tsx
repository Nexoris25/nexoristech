/**
 * Careers page, transcribed from the approved design handoff (Careers.html): a centered hero, the
 * culture cards, the benefits grid, the CMS-driven open roles (with a team filter and an honest
 * empty state), and the hiring process. Roles come from Strapi (getJobs); the static sections are
 * transcribed from the handoff. Rendered inside .svc-page.careers-page; ScrollFx adds reveals.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { ContextualPhoto } from "../ContextualPhoto.js";
import { ScrollFx } from "../home/ScrollFx.js";
import { CareersRoles } from "./CareersRoles.js";
import type { JobCard } from "../../lib/cms.js";

const CULTURE: { title: string; body: string; icon: ReactNode }[] = [
  {
    title: "Quality you would put your name on",
    body: "Everything we ship is held to one standard: would we be comfortable using it ourselves? That means code reviews that actually review, designs that get challenged, and nobody saying “it is fine” about something that is not.",
    icon: (
      <path d="M12 2l2.4 5.3 5.6.6-4.2 3.8 1.2 5.6L12 20.3 7 17.3l1.2-5.6L4 7.9l5.6-.6z" />
    ),
  },
  {
    title: "Honesty in both directions",
    body: "We give clients straight answers about timelines, costs, and technical decisions, even when it is uncomfortable. You will get the same honesty about your work, and we expect it back about ours.",
    icon: (
      <>
        <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
        <path d="M9 12l2 2 4-4" />
      </>
    ),
  },
  {
    title: "Tools that earn their place",
    body: "We keep our methods current, but we adopt new tools only when they genuinely improve the product. You will work with a modern stack chosen on merit, not on hype.",
    icon: <path d="M14 7l-2 12M10 5L8 17M5 9h14M4 15h14" />,
  },
  {
    title: "Relationships that outlast a project",
    body: "Most of our clients stay with us after launch. Most of our people do too. We are building a company for the long run, and it shows in how we treat both.",
    icon: (
      <>
        <circle cx="8" cy="9" r="3.2" />
        <circle cx="16" cy="9" r="3.2" />
        <path d="M2.5 19a5.5 5.5 0 0 1 11 0M13 19a5.5 5.5 0 0 1 8.5-4.6" />
      </>
    ),
  },
];

const BENEFITS: { title: string; sub: string; icon: ReactNode }[] = [
  {
    title: "Competitive pay",
    sub: "Reviewed every year, honestly.",
    icon: (
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    ),
  },
  {
    title: "Health cover",
    sub: "For you, so you can focus.",
    icon: (
      <path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10z" />
    ),
  },
  {
    title: "Learning budget",
    sub: "That actually gets used.",
    icon: (
      <>
        <path d="M3 6l9-3 9 3-9 3z" />
        <path d="M21 6v6M7 8v6c0 1.5 2.2 3 5 3s5-1.5 5-3V8" />
      </>
    ),
  },
  {
    title: "Current hardware",
    sub: "The right tools to do the work.",
    icon: (
      <>
        <rect x="3" y="4" width="18" height="12" rx="2" />
        <path d="M8 20h8M12 16v4" />
      </>
    ),
  },
  {
    title: "Flexible & remote-friendly",
    sub: "Outcomes over clock-watching.",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
  },
  {
    title: "Real ownership",
    sub: "Of your work and decisions.",
    icon: <path d="M5 13l4 4L19 7" />,
  },
  {
    title: "Access to leadership",
    sub: "The founder is in the room.",
    icon: (
      <>
        <path d="M4 20a8 8 0 0 1 16 0" />
        <circle cx="12" cy="8" r="4" />
      </>
    ),
  },
  {
    title: "Long-run thinking",
    sub: "A company built to last.",
    icon: (
      <>
        <rect x="4" y="5" width="16" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M4 11h16" />
      </>
    ),
  },
];

const PROCESS = [
  {
    n: "1",
    title: "You apply",
    body: "Send your CV and, more importantly, something you have built or written. We reply to every application within one week.",
  },
  {
    n: "2",
    title: "A first conversation",
    body: "Thirty to forty-five minutes about your work, how you think, and what you want next. No trick questions.",
  },
  {
    n: "3",
    title: "A practical exercise",
    body: "Small, paid where substantial, and close to the real work. We respect your time, so it is scoped honestly.",
  },
  {
    n: "4",
    title: "A final conversation",
    body: "You meet the founder, ask anything, and if both sides are sure, we move fast and make an offer.",
  },
];

export function CareersView({ jobs }: { jobs: JobCard[] }): ReactNode {
  return (
    <div className="svc-page careers-page">
      <ScrollFx />

      {/* HERO */}
      <section className="hero" aria-label="Careers at Nexoris Technologies">
        <div className="glow" />
        <div className="wrap">
          <nav className="crumb reveal" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span className="sep">/</span>
            <span className="here">Careers</span>
          </nav>
          <div className="hero-inner reveal">
            <span className="kicker on-dark">
              <span className="dot" />
              Careers &middot; Lagos
            </span>
            <h1>
              Come do work you will{" "}
              <span className="hero-accent">still be proud of.</span>
            </h1>
            <p className="lede">
              We hire people who care that the thing works, looks right, and
              holds up after launch. If that is already how you work, read on.
            </p>
            <div className="hero-cta">
              <Link className="btn btn-primary" href="#roles">
                See open roles <span className="arr">&rarr;</span>
              </Link>
              <Link className="btn btn-ghost on-dark" href="#process">
                How hiring works
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CULTURE */}
      <section className="band" aria-label="Working together">
        <div className="wrap company-editorial careers-editorial">
          <div>
            <span className="kicker">The work we care about</span>
            <h2 className="h-section">Thoughtful people. Useful software.</h2>
            <p className="lede">
              Explore our approach to building software, the way we work
              together, and the roles currently open.
            </p>
            <Link href="/how-we-work/" className="link-arrow">
              See how we work →
            </Link>
          </div>
          <ContextualPhoto
            image={{
              src: "/images/photography/focused-work.webp",
              alt: "A technology professional focusing on her work at a laptop",
            }}
          />
        </div>
      </section>
      <section className="band" aria-label="Culture">
        <div className="wrap">
          <div className="band-head reveal">
            <span className="kicker">
              <span className="dot" />
              Culture
            </span>
            <h2 className="h-section">What it is like here.</h2>
          </div>
          <div className="cr-cult-grid reveal">
            {CULTURE.map((c) => (
              <article className="cr-cult" key={c.title}>
                <div className="ci">
                  <svg viewBox="0 0 24 24">{c.icon}</svg>
                </div>
                <h3>{c.title}</h3>
                <p>{c.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="band soft" aria-label="Benefits">
        <div className="wrap">
          <div className="band-head reveal">
            <span className="kicker">
              <span className="dot" />
              Benefits
            </span>
            <h2 className="h-section">How we look after the team.</h2>
          </div>
          <div className="cr-ben-grid reveal">
            {BENEFITS.map((b) => (
              <div className="cr-ben" key={b.title}>
                <span className="bi">
                  <svg viewBox="0 0 24 24">{b.icon}</svg>
                </span>
                <span className="bt">
                  <b>{b.title}</b>
                  <span>{b.sub}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROLES */}
      <section className="band" id="roles" aria-label="Open roles">
        <div className="wrap">
          <div className="band-head reveal">
            <span className="kicker">
              <span className="dot" />
              Open roles
            </span>
            <h2 className="h-section">Roles open right now.</h2>
          </div>
          <CareersRoles jobs={jobs} />
        </div>
      </section>

      {/* PROCESS */}
      <section className="band soft" id="process" aria-label="How hiring works">
        <div className="wrap">
          <div className="band-head reveal">
            <span className="kicker">
              <span className="dot" />
              How hiring works
            </span>
            <h2 className="h-section">
              Start to finish, in two to three weeks.
            </h2>
          </div>
          <div className="cr-proc reveal">
            {PROCESS.map((p) => (
              <article className="cr-pstep" key={p.n}>
                <div className="pn">{p.n}</div>
                <h3>{p.title}</h3>
                <p>{p.body}</p>
              </article>
            ))}
          </div>
          <div className="cr-proc-note reveal">
            <span className="pi">
              <svg viewBox="0 0 24 24">
                <path d="M12 8v4l3 2" />
                <circle cx="12" cy="12" r="9" />
              </svg>
            </span>
            <span>
              The whole process takes <b>two to three weeks</b>, and we reply to
              every application within one week.
            </span>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta" aria-label="Get in touch">
        <div className="glow" />
        <div className="wrap cta-inner reveal">
          <h2>No role that fits? Tell us what you are great at.</h2>
          <p>
            We have hired people before a role existed, because the right person
            showed up.
          </p>
          <a className="btn btn-primary" href="mailto:careers@nexoristech.com">
            careers@nexoristech.com <span className="arr">&rarr;</span>
          </a>
        </div>
      </section>
    </div>
  );
}
