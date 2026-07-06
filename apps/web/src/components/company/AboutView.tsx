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

const TOOLS: { name: string; mark: string; color: string; kind: string }[] = [
  { name: "Next.js", mark: "N", color: "#0d0a1c", kind: "Framework" },
  { name: "React", mark: "R", color: "#0b7a99", kind: "Frontend" },
  { name: "TypeScript", mark: "TS", color: "#2d67b2", kind: "Language" },
  { name: "Tailwind CSS", mark: "Tw", color: "#0e7490", kind: "Styling" },
  { name: "Node.js", mark: "Nd", color: "#2e7d32", kind: "Runtime" },
  { name: "NestJS", mark: "Ns", color: "#c2183c", kind: "Backend" },
  { name: "Python", mark: "Py", color: "#2e6da4", kind: "Language" },
  { name: "Django", mark: "Dj", color: "#0c4b33", kind: "Backend" },
  { name: "PHP", mark: "PHP", color: "#565a9e", kind: "Language" },
  { name: "Laravel", mark: "Lv", color: "#d42c1e", kind: "Backend" },
  { name: "PostgreSQL", mark: "Pg", color: "#2f5d8a", kind: "Database" },
  { name: "MySQL", mark: "My", color: "#00618a", kind: "Database" },
  { name: "Prisma", mark: "Pr", color: "#2d3748", kind: "ORM" },
  { name: "Docker", mark: "Dk", color: "#1e77c7", kind: "Infra" },
  { name: "Figma", mark: "Fg", color: "#7a3fcc", kind: "Design" },
];

/* Original brand illustration standing in for a team photo (a diverse Lagos team at work). */
const TEAM_ART: ReactNode = (
  <svg
    className="abt-art"
    viewBox="0 0 400 300"
    preserveAspectRatio="xMidYMid slice"
    role="img"
    aria-label="An illustration of the Nexoris Technologies team at work in Lagos"
  >
    <defs>
      <linearGradient id="abt-bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#241a5c" />
        <stop offset="1" stopColor="#120d2b" />
      </linearGradient>
    </defs>
    <rect width="400" height="300" fill="url(#abt-bg)" />
    <circle cx="300" cy="70" r="120" fill="#6a55f2" opacity="0.18" />
    {/* floating UI cards */}
    <g transform="translate(40 44)">
      <rect width="120" height="66" rx="12" fill="#fff" opacity="0.96" />
      <rect x="14" y="14" width="60" height="9" rx="4" fill="#c3b8f4" />
      <rect x="14" y="34" width="92" height="7" rx="3" fill="#e9e7f0" />
      <rect x="14" y="46" width="70" height="7" rx="3" fill="#e9e7f0" />
    </g>
    <g transform="translate(250 40)">
      <rect width="110" height="72" rx="12" fill="#fff" opacity="0.96" />
      <rect x="14" y="46" width="12" height="14" rx="2" fill="#6a55f2" />
      <rect x="34" y="34" width="12" height="26" rx="2" fill="#543cda" />
      <rect x="54" y="22" width="12" height="38" rx="2" fill="#4330b8" />
      <rect x="74" y="30" width="12" height="30" rx="2" fill="#6a55f2" />
      <circle cx="94" cy="18" r="7" fill="#2ee6a8" />
    </g>
    {/* three team members */}
    {[
      { x: 96, skin: "#8b5634", hair: "#1d1233", shirt: "#6a55f2" },
      { x: 200, skin: "#a06a42", hair: "#2a1622", shirt: "#c3b8f4" },
      { x: 304, skin: "#6b4226", hair: "#150f2e", shirt: "#8b78f0" },
    ].map((p, i) => (
      <g key={i} transform={`translate(${p.x} 300)`}>
        <path d={`M-52 0 a52 44 0 0 1 104 0 z`} fill={p.shirt} />
        <ellipse cx="0" cy="-58" rx="30" ry="33" fill={p.skin} />
        <path d="M-30 -66 a30 30 0 0 1 60 0 q-30 -18 -60 0 z" fill={p.hair} />
        <ellipse cx="-11" cy="-58" rx="3" ry="3.6" fill="#2a1622" />
        <ellipse cx="11" cy="-58" rx="3" ry="3.6" fill="#2a1622" />
        <path d="M-9 -46 q9 7 18 0" stroke="#5a2f1a" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      </g>
    ))}
  </svg>
);

/* Original brand illustration standing in for a workspace photo. */
const WORKSPACE_ART: ReactNode = (
  <svg
    className="abt-art"
    viewBox="0 0 300 375"
    preserveAspectRatio="xMidYMid slice"
    role="img"
    aria-label="An illustration of a Nexoris Technologies workspace"
  >
    <defs>
      <linearGradient id="abt-wbg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#efeafc" />
        <stop offset="1" stopColor="#dcd6f9" />
      </linearGradient>
    </defs>
    <rect width="300" height="375" fill="url(#abt-wbg)" />
    <circle cx="70" cy="80" r="90" fill="#6a55f2" opacity="0.12" />
    {/* desk */}
    <rect x="0" y="286" width="300" height="10" fill="#c3b8f4" />
    {/* monitor with a dashboard */}
    <g transform="translate(72 96)">
      <rect width="156" height="112" rx="10" fill="#17122f" />
      <rect x="10" y="10" width="136" height="92" rx="6" fill="#0f0b22" />
      <rect x="22" y="22" width="52" height="8" rx="4" fill="#c3b8f4" />
      <rect x="22" y="74" width="18" height="14" rx="2" fill="#6a55f2" />
      <rect x="46" y="60" width="18" height="28" rx="2" fill="#543cda" />
      <rect x="70" y="48" width="18" height="40" rx="2" fill="#4330b8" />
      <rect x="94" y="56" width="18" height="32" rx="2" fill="#6a55f2" />
      <circle cx="120" cy="34" r="9" fill="#2ee6a8" />
      <rect x="66" y="112" width="24" height="18" fill="#17122f" />
      <rect x="46" y="130" width="64" height="8" rx="4" fill="#17122f" />
    </g>
    {/* plant */}
    <g transform="translate(238 226)">
      <path d="M6 60 h20 l-3 -30 h-14 z" fill="#543cda" />
      <path d="M16 30 q-22 -8 -18 -34 q18 4 18 34z" fill="#3e8e6e" />
      <path d="M16 30 q22 -8 18 -34 q-18 4 -18 34z" fill="#2f6f54" />
    </g>
    {/* coffee */}
    <g transform="translate(44 258)">
      <rect x="0" y="0" width="30" height="24" rx="5" fill="#fff" />
      <path d="M30 6 h7 a6 6 0 0 1 0 12 h-7" fill="none" stroke="#fff" strokeWidth="4" />
    </g>
  </svg>
);

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
            <div className="hero-media reveal">
              {TEAM_ART}
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
              <div className="abt-story-media">{WORKSPACE_ART}</div>
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
            <p className="abt-stack-lede reveal">
              We chose these tools for performance and easy long-term maintenance, and we adjust them
              to fit each project rather than forcing every project to fit them.
            </p>
            <div className="abt-tools reveal">
              {TOOLS.map((t) => (
                <div className="abt-tool" key={t.name}>
                  <span className="mk" style={{ background: t.color }} aria-hidden="true">
                    {t.mark}
                  </span>
                  <span className="tn">
                    <b>{t.name}</b>
                    <span>{t.kind}</span>
                  </span>
                </div>
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
