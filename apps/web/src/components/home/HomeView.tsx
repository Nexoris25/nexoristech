/**
 * The Nexoris Technologies homepage, ported section-for-section from the approved design handoff
 * (2026-06-27). Static, approved copy renders in full; the proof figures, testimonials, and
 * insights are data-driven and only show verified content from the CMS (PRD no-fabrication rule),
 * so they render honest empty states until that content exists. Styling lives in styles/design.css.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { SolutionFinder } from "./SolutionFinder.js";
import { Testimonials, type Quote } from "./Testimonials.js";
import { ProductMockup } from "./ProductMockup.js";
import { ProductShowcase } from "./ProductShowcase.js";
import { CaseStudyProof } from "../CaseStudyProof.js";
import { OgeChat } from "./OgeChat.js";
import { ScrollFx } from "./ScrollFx.js";
import type { InsightCard, CaseStudyCard } from "../../lib/cms.js";
import { ArticleCard } from "../insights/ArticleCard.js";

/*
 * The home page lists articles with the same card as everywhere else, so it takes the same type.
 *
 * It used to declare its own narrower shape, which dropped the category and the author's photograph
 * on the way in — the two fields the shared card needs. `getLatestInsights` had always returned them;
 * this type was quietly throwing them away.
 */
export type HomeInsight = InsightCard;
export const HOME_FAQ = [
  {
    q: "What does Nexoris Technologies actually do?",
    a: "We design and build websites, web applications, mobile apps, and custom business systems for companies in Nigeria and abroad. Where AI can genuinely make the product better, we build it in. Where it cannot, we leave it out and tell you why.",
  },
  {
    q: "Do I need to understand the technology to work with you?",
    a: "No. Tell us the problem in plain words. We turn it into a clear scope, and the Solution Finder or a short call points you to the right service without the jargon.",
  },
  {
    q: "How long does a project take, and what will it cost?",
    a: "A business website is usually four to eight weeks. A custom system or app typically runs three to six months, delivered in stages so you see working software early. Every project starts with a written scope, timeline, and cost before work begins, so there are no surprise invoices.",
  },
  {
    q: "Do I own what you build?",
    a: "Yes, completely. All source code, designs, and project files are handed over to you at the end of the project. Nothing is held back, and your team can run it independently.",
  },
  {
    q: "Do you force AI into every project?",
    a: "No. We add AI only where it earns its place, like answering customers at any hour or warning you before stock runs out. If your project does not need it, we will say so before you pay for it.",
  },
  {
    q: "What happens after launch?",
    a: "You own everything and can run it yourself. Most clients also take a managed plan so we keep monitoring, updating, and improving the product. Either way, the choice is yours.",
  },
];

export function HomeView({
  insights = [],
  testimonials = [],
  studies = [],
}: {
  insights?: InsightCard[];
  testimonials?: Quote[];
  studies?: CaseStudyCard[];
}): ReactNode {
  return (
    <div className="home-page">
      <ScrollFx />

      {/* HERO */}
      <section className="hero hero-home" aria-label="Hero">
        <div className="glow" />
        <div className="wrap">
          <div className="hero-inner reveal">
            <span className="kicker on-dark">
              <span className="dot" />
              Software development &middot; Lagos, Nigeria
            </span>
            <h1 style={{ marginTop: 18 }}>
              Software built around the way your business really works.
            </h1>
            <p className="lede">
              Nexoris Technologies designs and builds websites, web
              applications, mobile apps, and business systems for companies in
              Nigeria and abroad.
            </p>
            <div className="hero-cta">
              <Link className="btn btn-primary" href="/contact">
                Start a project <span className="arr">&rarr;</span>
              </Link>
              <a className="btn btn-ghost on-dark" href="#finder">
                Find the right service
              </a>
            </div>
            <div className="trust">
              <span className="ts-ic">
                <svg viewBox="0 0 24 24">
                  <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </span>
              Trusted by founders, executives, operations leaders, and public
              institutions.
            </div>
          </div>
          <ProductMockup />
          <p className="demo-caption home-demo-caption">
            Example business dashboard · illustrative data
          </p>
          <p className="hero-support">
            Where AI can genuinely make a product better, we build it in, and
            everything we deliver belongs to you, completely.
          </p>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="band" aria-label="The problem">
        <div className="wrap">
          <div className="band-head reveal">
            <span className="kicker">
              <span className="dot" />
              The problem
            </span>
            <h2 className="h-section">
              You already know where the time is going.
            </h2>
          </div>
          <div className="pain-grid reveal">
            <article className="pain-card">
              <div className="pain-ic">
                <svg viewBox="0 0 24 24">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                </svg>
              </div>
              <h3>The retyping.</h3>
              <p>
                Your team enters the same customer details into three different
                tools, every single day. Nobody planned it that way. It just
                grew, and now it quietly eats hours that should go into real
                work.
              </p>
            </article>
            <article className="pain-card">
              <div className="pain-ic">
                <svg viewBox="0 0 24 24">
                  <circle cx="12" cy="13" r="8" />
                  <path d="M12 9v4l2.5 2M9 2h6" />
                </svg>
              </div>
              <h3>The waiting.</h3>
              <p>
                The report you need for Monday&apos;s decision arrives on
                Wednesday. By then the moment has passed, and you decided on
                instinct. Again.
              </p>
            </article>
            <article className="pain-card">
              <div className="pain-ic">
                <svg viewBox="0 0 24 24">
                  <path d="M21 11.5a8.38 8.38 0 0 1-9 8.4L3 21l1.1-3.5A8.5 8.5 0 1 1 21 11.5z" />
                  <path d="M4 4l16 16" />
                </svg>
              </div>
              <h3>The silence.</h3>
              <p>
                A customer sends a message at 9pm with money in hand and a
                simple question. Nobody is there to answer. By morning, they
                have bought from someone who was.
              </p>
            </article>
          </div>
          <p className="pain-close reveal">
            These are solvable problems. <b>Solving them is what we do.</b>
          </p>
        </div>
      </section>

      {/* SOLUTION FINDER (deep-purple surface so the dark finder card sits in a matching band) */}
      <section className="band" id="finder" aria-label="Solution Finder">
        <div className="wrap">
          <SolutionFinder />
        </div>
      </section>

      {/* SERVICES */}
      <section className="band" id="services" aria-label="Services">
        <div className="wrap">
          <div className="band-head reveal">
            <span className="kicker">
              <span className="dot" />
              What we do
            </span>
            <h2 className="h-section">Four ways we help.</h2>
          </div>
          <div className="svc-grid reveal">
            <article className="svc-card">
              <div className="svc-head">
                <div className="svc-ic ic1">
                  <svg viewBox="0 0 24 24">
                    <rect x="3" y="4" width="18" height="14" rx="2" />
                    <path d="M3 9h18M8 21h8M12 18v3" />
                  </svg>
                </div>
                <span className="svc-num">01</span>
              </div>
              <h3>Build new software.</h3>
              <p>
                We design and build websites, apps, online stores, and custom
                systems around the way you work. Not the other way round.
              </p>
              <div className="svc-links">
                <Link className="tag" href="/ai-product-development">
                  AI Product Development
                </Link>
                <Link className="tag" href="/ai-ecommerce-development">
                  AI E-Commerce
                </Link>
                <Link className="tag" href="/govtech-platforms">
                  GovTech Platforms
                </Link>
                <Link className="tag" href="/iot-development">
                  IoT Development
                </Link>
              </div>
            </article>
            <article className="svc-card">
              <div className="svc-head">
                <div className="svc-ic ic2">
                  <svg viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 13a1.6 1.6 0 0 0 .3 1.8 2 2 0 1 1-2.8 2.8 1.6 1.6 0 0 0-2.7 1.1 2 2 0 1 1-4 0 1.6 1.6 0 0 0-2.6-1.1 2 2 0 1 1-2.8-2.8A1.6 1.6 0 0 0 4.6 12a2 2 0 1 1 0-4 1.6 1.6 0 0 0 1.4-2.6 2 2 0 1 1 2.8-2.8A1.6 1.6 0 0 0 11 3.4a2 2 0 1 1 4 0 1.6 1.6 0 0 0 2.7 1.1 2 2 0 1 1 2.8 2.8A1.6 1.6 0 0 0 20.6 10a2 2 0 1 1 0 4 1.6 1.6 0 0 0-1.2 1z" />
                  </svg>
                </div>
                <span className="svc-num">02</span>
              </div>
              <h3>Automate the busywork.</h3>
              <p>
                We take the repetitive work off your team and answer your
                customers at any hour. Your people get their time back for work
                that needs judgement.
              </p>
              <div className="svc-links">
                <Link className="tag" href="/business-process-automation">
                  Business Process Automation
                </Link>
                <Link className="tag" href="/ai-chatbots-virtual-assistants">
                  AI Chatbots &amp; Virtual Assistants
                </Link>
                <Link className="tag" href="/ai-systems-integration">
                  AI &amp; Systems Integration
                </Link>
              </div>
            </article>
            <article className="svc-card">
              <div className="svc-head">
                <div className="svc-ic ic3">
                  <svg viewBox="0 0 24 24">
                    <path d="M3 3v18h18" />
                    <path d="M7 15l3.5-4 3 2.5L21 7" />
                  </svg>
                </div>
                <span className="svc-num">03</span>
              </div>
              <h3>Understand your numbers.</h3>
              <p>
                We turn your data into clear dashboards and forecasts you can
                act on. No more deciding this quarter with last quarter&apos;s
                numbers.
              </p>
              <div className="svc-links">
                <Link
                  className="tag"
                  href="/data-dashboards-predictive-analytics"
                >
                  Data Dashboards &amp; Analytics
                </Link>
                <Link className="tag" href="/data-infrastructure-ai-readiness">
                  Data Infrastructure &amp; AI Readiness
                </Link>
              </div>
            </article>
            <article className="svc-card">
              <div className="svc-head">
                <div className="svc-ic ic4">
                  <svg viewBox="0 0 24 24">
                    <path d="M3 17l6-6 4 4 8-8" />
                    <path d="M15 7h6v6" />
                  </svg>
                </div>
                <span className="svc-num">04</span>
              </div>
              <h3>Grow it and keep it running.</h3>
              <p>
                We help people find you online and we look after your software
                long after launch. The product you paid for keeps getting
                better.
              </p>
              <div className="svc-links">
                <Link className="tag" href="/ai-seo-geo">
                  AI Content, SEO &amp; GEO
                </Link>
                <Link className="tag" href="/managed-technology-operations">
                  Managed Technology Operations
                </Link>
              </div>
            </article>
          </div>
          <div className="svc-foot reveal">
            <Link className="link-arrow" href="/how-we-work">
              See everything we do <span className="arr">&rarr;</span>
            </Link>
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section className="band soft" id="process" aria-label="How we work">
        <div className="wrap">
          <div className="band-head reveal">
            <span className="kicker">
              <span className="dot" />
              How we work
            </span>
            <h2 className="h-section">
              How a project runs, from first call to handover.
            </h2>
            <p className="lede">
              Whether it is a single website or a full business platform, the
              process stays the same. Plan properly, design before building, and
              check the work at every stage.
            </p>
          </div>
          <div className="proc-grid reveal">
            {[
              [
                "Discovery and Planning",
                "We agree a clear plan, scope, and timeline before development begins, so both sides know what is being built, by when, and for how much.",
                <>
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4.3-4.3" />
                </>,
              ],
              [
                "UX and UI Design",
                "You see and approve the full designs before we write serious code. Changing a design costs little, while changing built software costs a lot.",
                <path d="M12 19l7-7 3 3-7 7-3-3zM2 2l6 6M2 2l4 .8L6.8 8" />,
              ],
              [
                "Development",
                "We build in visible stages and keep you updated throughout. If something shifts, you hear it from us first, with options.",
                <path d="M8 8l-4 4 4 4M16 8l4 4-4 4M13 6l-2 12" />,
              ],
              [
                "Quality Assurance",
                "We check the work across real browsers, devices, and connections before any stage is marked complete. It has to work for your real users.",
                <>
                  <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
                  <path d="M9 12l2 2 4-4" />
                </>,
              ],
              [
                "Deployment and Handover",
                "Documentation, training where needed, and every source file handed over to your team. Nothing is held back.",
                <>
                  <path d="M12 2c3 2 5 5 5 9a5 5 0 0 1-10 0c0-4 2-7 5-9z" />
                  <path d="M9 16c-1 1-1.5 3-1.5 5M15 16c1 1 1.5 3 1.5 5" />
                </>,
              ],
              [
                "Ongoing Support",
                "Maintenance plans that cover updates, monitoring, and steady improvement, because software nobody maintains slowly becomes a problem.",
                <>
                  <path d="M21 12a9 9 0 1 1-3-6.7" />
                  <path d="M21 4v4h-4" />
                </>,
              ],
            ].map(([title, body, icon], i) => (
              <div className="pstep" key={i as number}>
                <span className="pnode">
                  <span className="pn-badge">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <svg viewBox="0 0 24 24">{icon as ReactNode}</svg>
                </span>
                <div className="pnum">
                  Stage {String(i + 1).padStart(2, "0")}
                </div>
                <h3>{title as string}</h3>
                <p>{body as string}</p>
              </div>
            ))}
          </div>
          <div className="proc-foot reveal">
            <Link className="link-arrow" href="/how-we-work">
              See the full approach <span className="arr">&rarr;</span>
            </Link>
          </div>
        </div>
      </section>

      {/* INDUSTRIES */}
      <section className="band" id="industries" aria-label="Industries">
        <div className="wrap">
          <div className="band-head reveal">
            <span className="kicker">
              <span className="dot" />
              Industries
            </span>
            <h2 className="h-section">
              Built for twenty industries, organised four ways.
            </h2>
            <p className="lede">
              Good engineering travels, but every industry has its own problems,
              rules, and rhythms. We have built for twenty of them. Each one
              speaks your language, not ours.
            </p>
          </div>
          <div className="ind-grid reveal">
            <article className="ind-card">
              <div className="industry-group-photo">
                <Image
                  src="/images/context/retail.webp"
                  alt="A retailer scanning stock in a shop"
                  width={600}
                  height={400}
                  sizes="(max-width: 680px) 100vw, (max-width: 1000px) 50vw, 25vw"
                />
              </div>
              <div className="ind-top">
                <h3>Commerce &amp; Hospitality</h3>
              </div>
              <p className="desc">
                Where the customer is the whole business, and a slow reply is a
                lost sale.
              </p>
              <div className="ind-list">
                <Link href="/retail-ecommerce-software">
                  Retail &amp; E-Commerce
                </Link>
                <Link href="/restaurant-software">
                  Restaurants &amp; Cloud Kitchens
                </Link>
                <Link href="/hospitality-software">
                  Hospitality &amp; Short-Lets
                </Link>
                <Link href="/events-software">Events &amp; Conferences</Link>
                <Link href="/fitness-wellness-software">
                  Fitness &amp; Salons
                </Link>
              </div>
            </article>
            <article className="ind-card">
              <div className="industry-group-photo">
                <Image
                  src="/images/context/fintech.webp"
                  alt="Finance professionals reviewing transaction records"
                  width={600}
                  height={400}
                  sizes="(max-width: 680px) 100vw, (max-width: 1000px) 50vw, 25vw"
                />
              </div>
              <div className="ind-top">
                <h3>Finance &amp; Professional</h3>
              </div>
              <p className="desc">
                Where trust, compliance, and an exact paper trail are the
                product.
              </p>
              <div className="ind-list">
                <Link href="/fintech-software">
                  Financial Services &amp; Fintech
                </Link>
                <Link href="/insurance-software">
                  Insurance &amp; Insurtech
                </Link>
                <Link href="/professional-services-software">
                  Professional Services
                </Link>
                <Link href="/real-estate-software">
                  Real Estate &amp; Property
                </Link>
                <Link href="/automotive-software">Automotive</Link>
              </div>
            </article>
            <article className="ind-card">
              <div className="industry-group-photo">
                <Image
                  src="/images/context/ngo.webp"
                  alt="Programme officers reviewing a community water project"
                  width={600}
                  height={400}
                  sizes="(max-width: 680px) 100vw, (max-width: 1000px) 50vw, 25vw"
                />
              </div>
              <div className="ind-top">
                <h3>Public &amp; Social Impact</h3>
              </div>
              <p className="desc">
                Where the work serves citizens, patients, students, and
                communities.
              </p>
              <div className="ind-list">
                <Link href="/government-digital-solutions">
                  Government &amp; Public Sector
                </Link>
                <Link href="/healthcare-software">
                  Healthcare &amp; Clinics
                </Link>
                <Link href="/education-software">Education &amp; EdTech</Link>
                <Link href="/ngo-software">NGOs &amp; Development</Link>
                <Link href="/church-management-software">
                  Religious &amp; Faith
                </Link>
              </div>
            </article>
            <article className="ind-card">
              <div className="industry-group-photo">
                <Image
                  src="/images/context/manufacturing.webp"
                  alt="An engineer reviewing a manufacturing line"
                  width={600}
                  height={400}
                  sizes="(max-width: 680px) 100vw, (max-width: 1000px) 50vw, 25vw"
                />
              </div>
              <div className="ind-top">
                <h3>Industry &amp; Infrastructure</h3>
              </div>
              <p className="desc">
                Where physical operations move, and the software has to keep up
                with them.
              </p>
              <div className="ind-list">
                <Link href="/logistics-software">
                  Logistics &amp; Supply Chain
                </Link>
                <Link href="/manufacturing-software">
                  Manufacturing &amp; Industrial
                </Link>
                <Link href="/agritech-software">
                  Agriculture &amp; Agritech
                </Link>
                <Link href="/construction-software">
                  Construction &amp; Engineering
                </Link>
                <Link href="/media-entertainment-software">
                  Media &amp; Publishing
                </Link>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* PROOF */}
      {studies.length ? (
        <div className="svc-page">
          <CaseStudyProof
            studies={studies}
            heading="The work, in our clients’ context."
          />
        </div>
      ) : (
        <section className="band" id="proof" aria-label="Our work">
          <div className="wrap">
            <div className="band-head reveal">
              <span className="kicker">
                <span className="dot" />
                Our work
              </span>
              <h2 className="h-section">See what we build.</h2>
              <p className="lede">
                Explore Covyvo and GLEEN, our in-house products. Client case
                studies appear when their results are verified and approved for
                publication.
              </p>
            </div>
            <ProductShowcase />
            <div className="proof-foot reveal">
              <Link className="link-arrow" href="/case-studies">
                See the work <span className="arr">&rarr;</span>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* WHY */}
      <section className="band" aria-label="Why us">
        <div className="wrap">
          <div className="band-head reveal">
            <span className="kicker">
              <span className="dot" />
              Why us
            </span>
            <h2 className="h-section">What working with us is like.</h2>
          </div>
          <div className="why-grid reveal">
            <article className="why-card">
              <div className="wic">
                <svg viewBox="0 0 24 24">
                  <path d="M14 3v5h5" />
                  <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M8 13h8M8 17h5" />
                </svg>
              </div>
              <div>
                <h3>A written scope before any work begins.</h3>
                <p>
                  Every project starts with a written scope, timeline, and cost.
                  No confusion about what will be delivered and when, and no
                  surprise invoices later.
                </p>
              </div>
            </article>
            <article className="why-card">
              <div className="wic">
                <svg viewBox="0 0 24 24">
                  <path d="M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5z" />
                  <path d="M8 11h8M8 14h5" />
                </svg>
              </div>
              <div>
                <h3>Direct access to the people building your product.</h3>
                <p>
                  Nexoris Technologies is led by its founder, who works directly
                  on every project. You talk to the people doing the work, not
                  an account layer in between.
                </p>
              </div>
            </article>
            <article className="why-card">
              <div className="wic">
                <svg viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M3 12h18" />
                  <path d="M12 3c2.5 2.5 4 5.7 4 9s-1.5 6.5-4 9c-2.5-2.5-4-5.7-4-9s1.5-6.5 4-9z" />
                </svg>
              </div>
              <div>
                <h3>We know how Nigerian businesses really operate.</h3>
                <p>
                  Local payment systems, patchy connectivity, regulatory
                  requirements, and how decisions actually get made here. We
                  build for the real environment.
                </p>
              </div>
            </article>
            <article className="why-card">
              <div className="wic">
                <svg viewBox="0 0 24 24">
                  <circle cx="8" cy="9" r="3.5" />
                  <path d="M11 9h9l-2.2 2.2M16.5 9v3" />
                  <path d="M3.5 20a4.5 4.5 0 0 1 9 0" />
                </svg>
              </div>
              <div>
                <h3>Full ownership at handover.</h3>
                <p>
                  All source code, designs, and project files are handed over to
                  you at the end of the project. Nothing is held back.
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* AI APPROACH */}
      <section className="ai-band" aria-label="AI approach">
        <div className="glow" />
        <div className="wrap">
          <div className="ai-inner reveal">
            <div>
              <span className="kicker on-dark">
                <span className="dot" />
                Our AI approach
              </span>
              <h2>We add AI where it helps. We skip it where it does not.</h2>
              <p>
                Not every problem needs AI, and we will tell you when yours does
                not. But when it genuinely helps, like a chatbot that answers
                customers at midnight or a forecast that warns you before stock
                runs out, we build it in <b>properly from the start</b>.
              </p>
            </div>
            <OgeChat />
          </div>
        </div>
      </section>

      {/* TESTIMONIALS — the whole band is dropped when no testimonial is approved, rather than
          standing empty under its heading. */}
      {testimonials.length > 0 ? (
        <section className="band" aria-label="Testimonials">
          <div className="wrap">
            <div className="band-head reveal">
              <span className="kicker">
                <span className="dot" />
                What clients say
              </span>
              <h2 className="h-section">In their words.</h2>
            </div>
            <Testimonials quotes={testimonials} />
          </div>
        </section>
      ) : null}

      {/* INSIGHTS */}
      <section className="band tint" id="insights" aria-label="Insights">
        <div className="wrap">
          <div className="band-head reveal">
            <span className="kicker">
              <span className="dot" />
              Insights
            </span>
            <h2 className="h-section">Recent thinking from the team.</h2>
          </div>
          {/* The latest published articles, straight from the CMS. Nothing is rendered when there is
              no published content, rather than showing invented articles (PRD no-fabrication rule). */}
          {insights.length > 0 ? (
            /*
             * The same card the Insights hub and the author profiles use. This section had its own,
             * with initials in place of the author's face and no category, so an article looked like
             * a different thing here than everywhere else it was listed.
             *
             * insights-page is on the grid for the card styles, not for the page. Every rule in
             * insights.css is written as `.insights-page .card…`, so the shared card renders
             * unstyled anywhere that class is absent — the author's headshot came through at its
             * natural size and pushed the card apart. There is no bare `.insights-page` rule, so the
             * class brings no page-level styling with it; it only switches the card rules on. It
             * sits on the grid rather than a wrapper because `.insights-page .ins-grid` needs an
             * ancestor and would otherwise fight the home page's own grid.
             */
            <div className="insights-page ins-grid reveal">
              {insights.map((a) => (
                <ArticleCard article={a} key={a.slug} />
              ))}
            </div>
          ) : null}

          {/* Clear of the cards it follows, rather than sitting against the last row. */}
          <Link className="link-arrow ins-more" href="/insights">
            Read more insights <span className="arr">&rarr;</span>
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section
        className="band soft"
        id="faq"
        aria-label="Frequently asked questions"
      >
        <div className="wrap">
          <div className="faq-head reveal">
            <span className="kicker">
              <span className="dot" />
              Questions
            </span>
            <h2>The things people ask before they reach out.</h2>
            <p className="lede">
              Straight answers to what clients raise most often. If yours is not
              here, ask us directly and a real person will reply.
            </p>
          </div>
          <div className="faq-wrap reveal">
            {HOME_FAQ.map((item) => (
              <details className="faq" key={item.q}>
                <summary>
                  {item.q} <span className="fq-pm">+</span>
                </summary>
                <div className="faq-a">{item.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CLOSING CTA */}
      <section className="cta" id="cta" aria-label="Closing CTA">
        <div className="photo">
          {/* fill, because .cta .photo is already an inset-0 positioned box and the CSS crops with
              object-fit. sizes says it spans the viewport, so the optimiser picks by screen width. */}
          <Image
            src="/home-hero.webp"
            alt="Application source code on a screen, representing the software Nexoris Technologies builds"
            fill
            sizes="100vw"
            style={{ objectFit: "cover" }}
          />
        </div>
        <div className="glow" />
        <div className="wrap cta-inner reveal">
          <h2>Tell us what you are trying to achieve.</h2>
          <p>
            We will reply within one business day with a short call, a suggested
            approach, and a realistic sense of timeline and cost. No obligation
            on your part.
          </p>
          <Link className="btn btn-primary" href="/contact">
            Start a project <span className="arr">&rarr;</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
