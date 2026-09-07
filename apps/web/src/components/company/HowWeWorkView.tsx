/**
 * How We Work page, transcribed from the approved design handoff (How We Work.html): the six-stage
 * delivery process, the commitments we can be held to, three engagement models, where we do our
 * best work, and the FAQ. Rendered inside .svc-page to reuse the shared hero/band/cta/faq
 * primitives; bespoke pieces use the hwk- classes in styles/how-we-work.css. Static, so it is a
 * server component; ScrollFx adds the reveal animation.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { ScrollFx } from "../home/ScrollFx.js";

const STAGES: { title: string; body: ReactNode; icon: ReactNode }[] = [
  {
    title: "Discovery and Planning",
    icon: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.3-4.3" />
      </>
    ),
    body: (
      <>
        We start by understanding the business, its users, and any constraints.
        We ask a lot of questions, and we listen more than we talk. This stage
        produces a clear plan, scope, and timeline{" "}
        <b>before development begins</b>, so both sides know exactly what is
        being built, by when, and for how much.
      </>
    ),
  },
  {
    title: "UX/UI Design",
    icon: <path d="M12 19l7-7 3 3-7 7-3-3zM2 2l6 6M2 2l4 .8L6.8 8" />,
    body: (
      <>
        We create wireframes and full designs and have them reviewed with you
        before development starts. You see the product on screen and approve it
        before serious engineering money is spent. Changing a design costs
        little. Changing built software costs a lot.{" "}
        <b>We do the changing here.</b>
      </>
    ),
  },
  {
    title: "Development",
    icon: <path d="M8 8l-4 4 4 4M16 8l4 4-4 4M13 6l-2 12" />,
    body: (
      <>
        We build the product in stages using modern tools, and we keep you
        updated on progress throughout. You will never go weeks wondering what
        is happening. If something shifts, you hear it from us first, with
        options.
      </>
    ),
  },
  {
    title: "Quality Assurance and Testing",
    icon: (
      <>
        <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
        <path d="M9 12l2 2 4-4" />
      </>
    ),
    body: (
      <>
        We test across browsers and devices, and we check performance before any
        stage is marked complete. The product has to work for your real users on
        their real phones and connections, not just on our machines.
      </>
    ),
  },
  {
    title: "Deployment and Handover",
    icon: (
      <>
        <path d="M12 2c3 2 5 5 5 9a5 5 0 0 1-10 0c0-4 2-7 5-9z" />
        <path d="M9 16c-1 1-1.5 3-1.5 5M15 16c1 1 1.5 3 1.5 5" />
      </>
    ),
    body: (
      <>
        We deploy the finished product, provide documentation, and train your
        team where needed, so they can run the platform on their own. All source
        code, designs, and project files are handed over.{" "}
        <b>Nothing is held back.</b>
      </>
    ),
  },
  {
    title: "Ongoing Support",
    icon: (
      <>
        <path d="M21 12a9 9 0 1 1-3-6.7" />
        <path d="M21 4v4h-4" />
      </>
    ),
    body: (
      <>
        We offer maintenance plans that cover updates, monitoring, and small
        improvements after launch. Most clients stay with us on one, because
        software that nobody maintains slowly becomes a problem.
      </>
    ),
  },
];

const COMMITMENTS: ReactNode[] = [
  <>
    A <b>written scope, timeline, and cost</b> before work begins.
  </>,
  <>
    Straight answers when something changes, even when it is not what you
    expected to hear.
  </>,
  <>
    <b>Direct access</b> to the people building your product.
  </>,
  <>
    At the end, all source code, designs, and project files handed over to you.
    Nothing is held back, and there is <b>no quiet dependency</b> designed to
    keep you paying.
  </>,
];

const MODELS: { title: string; best: string; body: string; icon: ReactNode }[] =
  [
    {
      title: "A project with a fixed written scope",
      best: "Best when you know what you need",
      body: "Best when you know what you need and want a clear price and date for it. We scope it, agree it in writing, and deliver it in stages you can see.",
      icon: (
        <>
          <path d="M14 3v5h5" />
          <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M9 13l2 2 4-4" />
        </>
      ),
    },
    {
      title: "An ongoing product partnership",
      best: "Best for products that keep evolving",
      body: "Best when you are building something that will keep evolving, like a startup product or a growing platform. We work as your technical team over time, planning and shipping in regular cycles.",
      icon: (
        <>
          <path d="M12 3v18" />
          <path d="M5 8l7-5 7 5M5 16l7 5 7-5" />
        </>
      ),
    },
    {
      title: "A managed operations plan",
      best: "Best after launch",
      body: "Best after launch. We monitor, update, support, and improve your platform on a monthly plan, so it keeps earning instead of going stale.",
      icon: (
        <>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1" />
        </>
      ),
    },
  ];

const ICP: { title: string; body: string; icon: ReactNode }[] = [
  {
    title: "Growing businesses of 50 to 1,000 staff",
    body: "You have outgrown spreadsheets, informal processes, and off-the-shelf tools that almost fit. You need custom systems, dashboards, or apps for your team and customers, built around how you actually operate.",
    icon: <path d="M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6" />,
  },
  {
    title: "Funded startups",
    body: "You have raised money and need a senior technical partner to build or rebuild your product, add the right intelligent features, and get the system ready for more users. We move at startup speed without startup shortcuts.",
    icon: (
      <>
        <path d="M12 2c3 2 5 5 5 9a5 5 0 0 1-10 0c0-4 2-7 5-9z" />
        <path d="M9 16c-1 1-1.5 3-1.5 5M15 16c1 1 1.5 3 1.5 5" />
      </>
    ),
  },
  {
    title: "Larger companies modernising old systems",
    body: "You have legacy platforms that work but hold you back. We connect them, extend them, or replace them in stages, without stopping the business while we do it.",
    icon: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M3 9h18M8 14l2 2 4-4" />
      </>
    ),
  },
  {
    title: "Public sector and development organisations",
    body: "You are building citizen services, revenue systems, or programme platforms, and you carry procurement and compliance requirements most vendors underestimate. We understand that world and design for it from the start.",
    icon: <path d="M3 21h18M5 21V11l7-4 7 4v10M9 21v-5h6v5M12 3v4" />,
  },
];

export const HOW_WE_WORK_FAQ: { q: string; a: string }[] = [
  {
    q: "How long does a typical project take?",
    a: "A business website usually takes four to eight weeks. A custom system or app typically runs three to six months, delivered in stages so you see working software early. We give you a real timeline in the written scope, and we treat it as a commitment.",
  },
  {
    q: "What does a project cost?",
    a: "It depends on what we are building, and we will not pretend otherwise. What we promise is a clear written cost before work begins, honest ranges on our cost guides, and no surprise invoices. The scoping call gives you a realistic figure for your specific situation.",
  },
  {
    q: "Who owns the work at the end?",
    a: "You do, completely. All source code, designs, documentation, and project files are handed over at the end of the project. Nothing is held back.",
  },
  {
    q: "How do you handle our data?",
    a: "In line with the NDPR. We agree data handling rules in the scope, we limit access to the people who need it, and we are happy to sign an NDA before you share anything sensitive.",
  },
  {
    q: "What happens when the scope changes?",
    a: "We tell you what the change means for timeline and cost before we do anything, in writing. You decide. Scope creep without a conversation is how projects go bad, so we simply do not allow it.",
  },
  {
    q: "What if you think our idea will not work?",
    a: "We will tell you, with reasons, before you spend money on it. We have talked clients out of projects before. It is part of why they come back.",
  },
  {
    q: "Do you work with businesses outside Lagos?",
    a: "Yes. We work with clients across Nigeria and abroad. The process runs the same way remotely, with regular calls and demos at every stage.",
  },
];

export function HowWeWorkView(): ReactNode {
  return (
    <div className="svc-page how-work-page">
      <ScrollFx />

      {/* HERO */}
      <section className="hero hwk-hero" aria-label="How we work">
        <div className="glow" />
        <div className="wrap">
          <nav className="crumb reveal" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span className="sep">/</span>
            <span className="here">How We Work</span>
          </nav>
          <div className="hwk-hero-inner reveal">
            <span className="kicker on-dark">
              <span className="dot" />
              Our delivery process
            </span>
            <h1>
              Plan properly.{" "}
              <span className="hero-accent">Build with clarity.</span>
            </h1>
            <p className="lede">
              Whether the project is a single website or a full business
              platform, our process stays the same. We take time to understand
              the problem, design the solution carefully, and build software
              that is reliable, easy to maintain, and fully owned by you at the
              end.
            </p>
            <div className="hero-cta">
              <Link className="btn btn-primary" href="/contact">
                Book a scoping call <span className="arr">&rarr;</span>
              </Link>
              <Link className="btn btn-ghost on-dark" href="#delivery">
                Explore the process
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* STAGES */}
      <section className="band" id="delivery" aria-label="The six stages">
        <div className="wrap">
          <div className="band-head reveal">
            <span className="kicker">
              <span className="dot" />
              The process
            </span>
            <h2 className="h-section">A clear path from brief to handover.</h2>
            <p className="lede">
              Six stages, with something concrete to review at every step.
            </p>
          </div>
          <div className="hwk-stages reveal">
            {STAGES.map((s, i) => (
              <article className="hwk-stage" key={s.title}>
                <span className="delivery-number" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* COMMITMENTS */}
      <section className="band soft" aria-label="What you can hold us to">
        <div className="wrap">
          <div className="hwk-exp reveal">
            <div className="hwk-exp-c">
              <span className="kicker on-dark">
                <span className="dot" />
                Our commitments
              </span>
              <h2>What you can hold us to.</h2>
            </div>
            <div className="hwk-exp-list">
              {COMMITMENTS.map((c, i) => (
                <div className="hwk-exp-item" key={i}>
                  <span className="ei">
                    <svg viewBox="0 0 24 24">
                      <path d="M5 12l5 5L20 7" />
                    </svg>
                  </span>
                  <p>{c}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* MODELS */}
      <section className="band" id="engagement" aria-label="Ways to work">
        <div className="wrap">
          <div className="band-head reveal">
            <span className="kicker">
              <span className="dot" />
              Engagement models
            </span>
            <h2 className="h-section">Three ways to work with us.</h2>
          </div>
          <div className="hwk-models reveal">
            {MODELS.map((m) => (
              <article className="hwk-mdl" key={m.title}>
                <div className="ic">
                  <svg viewBox="0 0 24 24">{m.icon}</svg>
                </div>
                <h3>{m.title}</h3>
                <div className="best">{m.best}</div>
                <p>{m.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ICP */}
      <section className="band soft" aria-label="Who we serve best">
        <div className="wrap">
          <div className="band-head reveal">
            <span className="kicker">
              <span className="dot" />
              Who we serve best
            </span>
            <h2 className="h-section">Where we do our best work.</h2>
          </div>
          <div className="hwk-icp reveal">
            {ICP.map((c) => (
              <article className="hwk-icp-card" key={c.title}>
                <div className="ic">
                  <svg viewBox="0 0 24 24">{c.icon}</svg>
                </div>
                <div>
                  <h3>{c.title}</h3>
                  <p>{c.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="band" id="faq" aria-label="FAQ">
        <div className="wrap">
          <div className="faq-layout">
            <aside className="faq-aside reveal">
              <div className="fa-eyebrow">FAQ</div>
              <h2>Questions people ask before they hire us.</h2>
              <div className="faq-contact">
                <div className="fc-ic">
                  <svg viewBox="0 0 24 24">
                    <path d="M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5z" />
                  </svg>
                </div>
                <b>Still have a question?</b>
                <p>
                  The first conversation costs nothing and usually clears things
                  up.
                </p>
                <Link className="btn btn-primary" href="/contact">
                  Book a scoping call <span className="arr">&rarr;</span>
                </Link>
              </div>
            </aside>
            <div className="hwk-faqcol reveal">
              {HOW_WE_WORK_FAQ.map((f) => (
                <details className="faq" key={f.q}>
                  <summary>
                    {f.q} <span className="fq-pm">+</span>
                  </summary>
                  <div className="faq-a">{f.a}</div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta" aria-label="Closing CTA">
        <div className="glow" />
        <div className="wrap cta-inner reveal">
          <h2>
            The first conversation costs nothing and usually clears things up.
          </h2>
          <p>
            Tell us what you are trying to achieve. We will come back with a
            suggested approach and honest numbers.
          </p>
          <Link className="btn btn-primary" href="/contact">
            Book a scoping call <span className="arr">&rarr;</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
