/**
 * About Us page, transcribed from the approved design handoff (About Us.html): who we are, the
 * story, mission and vision, the five values, the stack, the team (founder Chinedu Nwogu), and the
 * careers teaser. Rendered inside .svc-page to reuse the shared hero/band/cta/hero-stats primitives;
 * bespoke pieces use the abt- classes in styles/about.css. The photo areas render as on-brand
 * panels and a CN initials avatar until real photos are supplied. Server component; ScrollFx adds
 * the reveal animation.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { ScrollFx } from "../home/ScrollFx.js";

const VALUES: { title: string; body: string; icon: ReactNode }[] = [
  {
    title: "Quality",
    body: "Every product we build is held to a standard we would be comfortable using ourselves. That applies to the code, the design, and how the finished product performs.",
    icon: <path d="M12 2l2.4 5.3 5.6.6-4.2 3.8 1.2 5.6L12 20.3 7 17.3l1.2-5.6L4 7.9l5.6-.6z" />,
  },
  {
    title: "Integrity",
    body: "We give honest information about timelines, costs, and technical decisions, even when it is not what a client expected to hear. You will always know where your project really stands.",
    icon: (
      <>
        <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
        <path d="M9 12l2 2 4-4" />
      </>
    ),
  },
  {
    title: "Continuous Improvement",
    body: "We keep our tools and methods up to date, and we adopt new ones only when they genuinely improve the product we are building. New is not the same as better.",
    icon: (
      <>
        <path d="M21 12a9 9 0 1 1-3-6.7" />
        <path d="M21 4v4h-4" />
      </>
    ),
  },
  {
    title: "Partnership",
    body: "We aim to build long working relationships with our clients, not just complete a single project. Most of the businesses we work with are still with us.",
    icon: (
      <>
        <circle cx="8" cy="9" r="3.2" />
        <circle cx="16" cy="9" r="3.2" />
        <path d="M2.5 19a5.5 5.5 0 0 1 11 0M13 19a5.5 5.5 0 0 1 8.5-4.6" />
      </>
    ),
  },
  {
    title: "Reliability",
    body: "We treat deadlines, communication, and handover commitments as exactly that: commitments.",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
  },
];

const STACK: { name: string; color: string }[] = [
  { name: "Next.js", color: "#543CDA" },
  { name: "React", color: "#6A55F2" },
  { name: "TypeScript", color: "#6A55F2" },
  { name: "NestJS", color: "#8B78F0" },
  { name: "PostgreSQL", color: "#6A55F2" },
  { name: "Prisma", color: "#8B78F0" },
  { name: "Tailwind CSS", color: "#543CDA" },
  { name: "Figma", color: "#c3b8f4" },
];

export function AboutView(): ReactNode {
  return (
    <div className="svc-page">
      <ScrollFx />

      {/* HERO */}
      <section className="hero" aria-label="About Nexoris Technologies">
        <div className="glow" />
        <div className="wrap">
          <nav className="crumb reveal" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span className="sep">/</span>
            <span className="here">About Us</span>
          </nav>
          <div className="hero-grid">
            <div className="hero-inner reveal">
              <span className="kicker on-dark">
                <span className="dot" />
                Who we are · Lagos, Nigeria
              </span>
              <h1>We build software the way we would want it built for us.</h1>
              <p className="lede">
                Nexoris Technologies Ltd is a Lagos-based company that designs and builds custom
                software for businesses in Nigeria and abroad. Every product we ship is held to a
                simple standard: would we be comfortable using it ourselves?
              </p>
              <div className="hero-cta">
                <Link className="btn btn-primary" href="/contact">
                  Work with us <span className="arr">&rarr;</span>
                </Link>
                <Link className="btn btn-ghost on-dark" href="/how-we-work">
                  See how we work
                </Link>
              </div>
              <div className="hero-stats">
                <div className="hstat">
                  <div className="hn">
                    <em>1</em> founder
                  </div>
                  <div className="hl">In the room on every project</div>
                </div>
                <div className="hstat">
                  <div className="hn">
                    <em>100%</em>
                  </div>
                  <div className="hl">Code and designs handed to you</div>
                </div>
                <div className="hstat">
                  <div className="hn">
                    NG <em>+</em>
                  </div>
                  <div className="hl">Clients in Nigeria and abroad</div>
                </div>
              </div>
            </div>
            <div className="hero-media reveal" role="img" aria-label="Nexoris Technologies, built in Lagos and used everywhere">
              <div className="abt-fill" />
              <div className="ovl" />
              <div className="hero-chip">
                <span className="hci">
                  <svg viewBox="0 0 24 24">
                    <path d="M3 12a9 9 0 0 1 18 0M12 3c2.5 2.5 4 5.7 4 9s-1.5 6.5-4 9c-2.5-2.5-4-5.7-4-9s1.5-6.5 4-9z" />
                    <path d="M3 12h18" />
                  </svg>
                </span>
                <span>
                  <b>Built in Lagos, used everywhere</b>
                  <span>Software for the real local environment</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STORY */}
      <section className="band" aria-label="Our story">
        <div className="wrap">
          <div className="band-head reveal">
            <span className="kicker">
              <span className="dot" />
              Our story
            </span>
            <h2 className="h-section">Why Nexoris Technologies exists.</h2>
          </div>
          <div className="abt-story">
            <div className="abt-story-body reveal">
              <p>
                Too much business software forces people to work around it. Staff keep a spreadsheet
                on the side because the system cannot do what they need. Managers wait days for numbers
                the business already has. Owners pay for tools the team quietly stopped using months
                ago.
              </p>
              <p>
                We started Nexoris Technologies to do the opposite. We begin with the problem and the
                people, and only then choose the technology. We take time to understand how your
                business actually runs, design the solution carefully, and build software that is
                reliable, easy to maintain, and <b>fully owned by you at the end</b>.
              </p>
              <p>
                The company is founded and led by Chinedu Nwogu, who works directly on every project
                from planning through to delivery. Our team combines modern software development
                practices with a clear understanding of the Nigerian business environment, including
                compliance requirements, local payment systems, and the way businesses here operate
                day to day. The result is software that performs well and that people can use without
                difficulty.
              </p>
            </div>
            <div className="abt-story-aside reveal">
              <div className="abt-story-media" role="img" aria-label="A Nexoris Technologies workspace" />
              <div className="abt-pull">
                <div className="qm">&ldquo;</div>
                <p>We begin with the problem and the people, and only then choose the technology.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MISSION / VISION */}
      <section className="band soft" aria-label="Mission and vision">
        <div className="wrap">
          <div className="band-head reveal">
            <span className="kicker">
              <span className="dot" />
              Direction
            </span>
            <h2 className="h-section">What we are building toward.</h2>
          </div>
          <div className="abt-mv reveal">
            <article className="abt-mv-card">
              <div className="ic">
                <svg viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="9" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
                </svg>
              </div>
              <div className="k">Our Mission</div>
              <h3>Reliable software that helps businesses grow.</h3>
              <p>
                To design and build reliable software that helps businesses in Nigeria and across
                Africa run more efficiently, reach more customers, and grow with confidence.
              </p>
            </article>
            <article className="abt-mv-card">
              <div className="ic">
                <svg viewBox="0 0 24 24">
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
              <div className="k">Our Vision</div>
              <h3>One of the most trusted software companies in Nigeria.</h3>
              <p>
                To be one of the most trusted software development companies in Nigeria, known for
                combining strong engineering with a clear understanding of how local businesses
                operate.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="band" aria-label="Values">
        <div className="wrap">
          <div className="band-head reveal">
            <span className="kicker">
              <span className="dot" />
              What we value
            </span>
            <h2 className="h-section">Five values we actually use, not just publish.</h2>
          </div>
          <div className="abt-vals reveal">
            {VALUES.map((v, i) => (
              <article className="abt-val" key={v.title}>
                <div className="abt-val-top">
                  <div className="abt-val-ic">
                    <svg viewBox="0 0 24 24">{v.icon}</svg>
                  </div>
                  <span
                    className="abt-val-num"
                    aria-hidden="true"
                    data-n={String(i + 1).padStart(2, "0")}
                  />
                </div>
                <h3>{v.title}</h3>
                <p>{v.body}</p>
              </article>
            ))}
            <article className="abt-val statement">
              <p>
                These are not wall posters. They are the rules we use to decide what we ship and what
                we will not.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* STACK */}
      <section className="band soft" aria-label="Our stack">
        <div className="wrap">
          <div className="band-head reveal">
            <span className="kicker">
              <span className="dot" />
              How we build
            </span>
            <h2 className="h-section">The tools we build with.</h2>
          </div>
          <div className="abt-stack">
            <div className="abt-stack-body reveal">
              <p>
                We chose these tools for performance and easy long-term maintenance, and we adjust
                them to fit each project rather than forcing every project to fit them.
              </p>
            </div>
            <div className="abt-chips reveal">
              {STACK.map((s) => (
                <span className="abt-schip" key={s.name}>
                  <i style={{ background: s.color }} />
                  {s.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* TEAM */}
      <section className="band" aria-label="The team">
        <div className="wrap">
          <div className="band-head reveal">
            <span className="kicker">
              <span className="dot" />
              The team
            </span>
            <h2 className="h-section">The people doing the work.</h2>
          </div>
          <div className="abt-team reveal">
            <article className="abt-founder">
              <div className="abt-founder-photo" role="img" aria-label="Chinedu Nwogu, Founder and Chief Executive Officer">
                <span className="abt-initials" aria-hidden="true">
                  CN
                </span>
              </div>
              <div className="abt-founder-body">
                <div className="role">Founder &amp; Chief Executive Officer</div>
                <h3>Chinedu Nwogu</h3>
                <p>
                  Chinedu founded Nexoris Technologies to build software that solves real problems for
                  businesses in Nigeria and abroad. He leads the company&rsquo;s technical direction
                  and works directly on every project, from planning through to delivery.
                </p>
                <span className="sig">
                  <svg viewBox="0 0 24 24">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                  When you hire Nexoris Technologies, he is in the room.
                </span>
              </div>
            </article>
            <article className="abt-soon">
              <div className="stripe" />
              <div className="ic">
                <svg viewBox="0 0 24 24">
                  <circle cx="9" cy="8" r="3.2" />
                  <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
                  <path d="M16 5h5M18.5 2.5v5" />
                </svg>
              </div>
              <h3>The team is growing.</h3>
              <p>
                We hire people who care that the thing works, looks right, and holds up after launch.
                As the team grows, the people behind your project will appear here.
              </p>
              <Link className="link-arrow" href="/careers">
                See open roles <span className="arr">&rarr;</span>
              </Link>
            </article>
          </div>
        </div>
      </section>

      {/* CAREERS TEASER */}
      <section className="band soft" aria-label="Careers">
        <div className="wrap">
          <div className="abt-teaser reveal">
            <div className="tz">
              <h2>If you care about doing this properly, we should talk.</h2>
              <p>We hire people who care that the thing works, looks right, and holds up after launch.</p>
            </div>
            <Link className="btn btn-primary" href="/careers">
              See open roles <span className="arr">&rarr;</span>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta" aria-label="Closing CTA">
        <div className="glow" />
        <div className="wrap cta-inner reveal">
          <h2>We would welcome the chance to discuss your project.</h2>
          <p>
            Tell us what you are trying to achieve, and we will come back with a clear suggestion and
            honest numbers.
          </p>
          <Link className="btn btn-primary" href="/contact">
            Work with us <span className="arr">&rarr;</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
