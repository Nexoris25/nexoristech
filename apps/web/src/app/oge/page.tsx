/**
 * "Meet Oge" showcase page, transcribed from the approved design handoff (Oge Assistant.html). It
 * introduces Oge, the website assistant: the avatar at every size, why the name and palette, what
 * she does, and the three conversation states. The CTAs open the live Oge widget through the global
 * window.Oge API. Rendered inside .svc-page to reuse the shared hero/band/cta primitives; bespoke
 * pieces use the ogp- classes in styles/oge-page.css.
 */
import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { buildMetadata, buildPageGraph } from "@nexoris/seo";
import { JsonLd } from "../../components/JsonLd.js";
import { ScrollFx } from "../../components/home/ScrollFx.js";
import { OgeMark } from "../../components/home/OgeMark.js";
import { OgeLaunchButton } from "../../components/oge/OgeLaunchButton.js";
import "../../styles/oge-page.css";

export const revalidate = 300;

export function generateMetadata(): Metadata {
  return buildMetadata({
    title: "Meet Oge | Nexoris Technologies",
    description:
      "Oge is the Nexoris Technologies website assistant. Grounded in our own content, English only, and built to point you to the right answer or the right person.",
    path: "/oge",
    ogType: "website",
    noindex: false,
  });
}

const CAPS: { icon: ReactNode; title: string; body: string }[] = [
  {
    icon: (
      <>
        <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
        <path d="M9 12l2 2 4-4" />
      </>
    ),
    title: "Grounded in our own content",
    body: "Oge answers only from the Nexoris Technologies knowledge base, built from every page on this site. It cannot wander off into things we did not write.",
  },
  {
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M8 12h8M12 8v8" />
      </>
    ),
    title: "Never invents a number",
    body: "No made-up price, timeline, client, or result. When the answer is not in our content, it says so plainly and offers the team.",
  },
  {
    icon: <path d="M4 7h16M4 12h10M4 17h7" />,
    title: "Declines off-topic in one sentence",
    body: "Ask it about the weather and it will politely say it only helps with Nexoris Technologies, then steer back, without a lecture.",
  },
  {
    icon: (
      <>
        <path d="M16 3h5v5M21 3l-9 9" />
        <path d="M10 5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5" />
      </>
    ),
    title: "Shows its source",
    body: "Every grounded answer carries a link to the page it came from, so you can read the full thing in context.",
  },
  {
    icon: (
      <>
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </>
    ),
    title: "Captures a lead, with your sign-off",
    body: "When you are ready to talk, Oge collects your details and shows exactly what it will send before anything goes to the team. Nothing sends without your confirmation.",
  },
  {
    icon: <path d="M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5z" />,
    title: "Degrades to a contact panel",
    body: "If the AI is ever unavailable, Oge still shows the most relevant answer it found and a direct path to WhatsApp or the contact form. You never see a broken feature.",
  },
];

const QUESTIONS = [
  { title: "Find the right service", question: "Which service would help automate my business?", body: "Explore what we build and follow the relevant service pages." },
  { title: "Understand the process", question: "What happens after I send a project brief?", body: "Learn how scoping, delivery, and support work before you get in touch." },
  { title: "Talk to the team", question: "Can I speak with someone about my project?", body: "Share your enquiry and review your details before they are sent." },
];

export default function MeetOgePage(): ReactNode {
  return (
    <div className="svc-page oge-page">
      <JsonLd graph={buildPageGraph({ page: { routeClass: "about", path: "/oge", name: "Meet Oge", description: "The Nexoris Technologies website assistant, helping you explore our services and contact the team.", breadcrumbs: [{ name: "Meet Oge", path: "/oge" }] } })} />
      <ScrollFx />

      {/* HERO */}
      <section className="hero" aria-label="Meet Oge">
        <div className="glow" />
        <div className="wrap">
          <nav className="crumb reveal" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span className="sep">/</span>
            <span className="here">Meet Oge</span>
          </nav>
          <div className="hero-grid">
            <div className="hero-inner reveal">
              <span className="kicker on-dark">
                <span className="dot" />
                The website assistant
              </span>
              <h1>Meet Oge.</h1>
              <p className="lede">
                Oge is the assistant on the Nexoris Technologies website. It answers from our own
                pages, points you to the right service, and connects you to a person when you are
                ready. It speaks plainly, in English, and it never makes things up.
              </p>
              <div className="hero-cta">
                <OgeLaunchButton action="open" className="btn btn-primary">
                  Chat with Oge <span className="arr">&rarr;</span>
                </OgeLaunchButton>
                <OgeLaunchButton action="fallback" className="btn btn-ghost on-dark">
                  See the fallback
                </OgeLaunchButton>
              </div>
            </div>
            <div className="ogp-stage reveal">
              <div className="ogp-avhero">
                <OgeMark size={120} />
                <span className="ring" aria-hidden="true" />
                <span className="st" aria-hidden="true" />
              </div>
              <div className="ogp-name">
                <b>Oge</b>
                <span>oge · Igbo for &ldquo;time&rdquo;</span>
              </div>
              <div className="ogp-bubble">
                Hi, I am <b>Oge</b>. Ask me what we build, how we work, or what something costs.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Customer questions, rather than internal avatar specifications. */}
      <section className="band" aria-label="Ways Oge can help">
        <div className="wrap">
          <div className="band-head reveal">
            <span className="kicker">
              <span className="dot" />
              Start a conversation
            </span>
            <h2 className="h-section">A useful place to start.</h2>
            <p className="lede">
              Ask a question in your own words. Oge helps you navigate our services, understand the process, and reach the team.
            </p>
          </div>
          <div className="ogp-caps reveal">
            {QUESTIONS.map((s) => (
              <article className="oge-prompt" key={s.title}>
                <h3>{s.title}</h3><p>“{s.question}”</p><p>{s.body}</p>
              </article>
            ))}
          </div>
          <div className="ogp-meaning reveal">
            <div className="ogp-mc">
              <h3>Why &ldquo;Oge&rdquo;</h3>
              <p>
                Oge is a woman&rsquo;s name, Igbo for time. It is short, easy to say across Nigeria,
                and it carries the promise she is built around: a fast answer, and your time back. A
                name and a face, not a robot label, because she talks like a knowledgeable person
                across a table.
              </p>
            </div>
            <div className="ogp-mc"><h3>A clear route to a person</h3><p>You can contact the team directly whenever you prefer. Oge is a starting point for questions about Nexoris Technologies.</p><Link className="link-arrow" href="/contact/">Contact the team →</Link></div>
          </div>
        </div>
      </section>

      {/* CAPABILITIES */}
      <section className="band soft" aria-label="What Oge does">
        <div className="wrap">
          <div className="band-head reveal">
            <span className="kicker">
              <span className="dot" />
              How it behaves
            </span>
            <h2 className="h-section">Helpful, grounded, and honest about its limits.</h2>
          </div>
          <div className="ogp-caps reveal">
            {CAPS.map((c) => (
              <article className="ogp-cap" key={c.title}>
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

      {/* STATES */}
      <section className="band" aria-label="Conversation states">
        <div className="wrap">
          <div className="band-head reveal">
            <span className="kicker">
              <span className="dot" />
              Inside a conversation
            </span>
            <h2 className="h-section">Three moments, one calm interface.</h2>
            <p className="lede">
              The live assistant sits in the corner of every page. Open it any time. These are the
              states it moves through.
            </p>
          </div>
          <div className="ogp-states reveal">
            <article className="ogp-mini">
              <div className="ogp-mini-h">
                <span className="av">
                  <OgeMark size={34} />
                </span>
                <div>
                  <b>Oge</b>
                  <span className="sub">Grounded answer</span>
                </div>
              </div>
              <div className="ogp-mini-b">
                <span className="ogp-tag">Answer with source</span>
                <div className="ogp-me">How long does a project take?</div>
                <div className="ogp-bot">
                  A business website usually takes <b>four to eight weeks</b>. A custom system runs{" "}
                  <b>three to six months</b>, in stages so you see working software early.
                </div>
                <span className="ogp-srcchip">☉ How We Work</span>
              </div>
            </article>
            <article className="ogp-mini">
              <div className="ogp-mini-h">
                <span className="av">
                  <OgeMark size={34} />
                </span>
                <div>
                  <b>Oge</b>
                  <span className="sub">Lead capture</span>
                </div>
              </div>
              <div className="ogp-mini-b">
                <span className="ogp-tag">Confirm before sending</span>
                <div className="ogp-bot">Here is exactly what goes to the team, with our chat attached.</div>
                <div className="ogp-conf">
                  <div className="cl">
                    <span>Name</span>
                    <b>Ada O.</b>
                  </div>
                  <div className="cl">
                    <span>Contact</span>
                    <b>ada@shop.ng</b>
                  </div>
                  <div className="cl">
                    <span>Topic</span>
                    <b>Online store</b>
                  </div>
                  <div className="cl">
                    <span>Transcript</span>
                    <b>Attached</b>
                  </div>
                </div>
                <div className="ogp-btn">Send to the team</div>
              </div>
            </article>
            <article className="ogp-mini">
              <div className="ogp-mini-h">
                <span className="av">
                  <OgeMark size={34} />
                </span>
                <div>
                  <b>Oge</b>
                  <span className="sub">Fallback</span>
                </div>
              </div>
              <div className="ogp-mini-b">
                <span className="ogp-tag">If the AI is unavailable</span>
                <div className="ogp-bot">
                  I am having trouble generating a full response right now. Here is what I found, and
                  the team can help you with anything beyond this.
                </div>
                <div className="ogp-bot">
                  <b>From our pages:</b> every project starts with a written scope, timeline, and cost.
                </div>
                <div className="ogp-btn wa">Message on WhatsApp</div>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta" aria-label="Closing CTA">
        <div className="glow" />
        <div className="wrap cta-inner reveal">
          <h2>Oge is open in the corner. Ask it anything.</h2>
          <p>
            Try a real question, or tell it you want to talk to the team and watch the confirmation
            step.
          </p>
          <OgeLaunchButton action="open" className="btn btn-primary">
            Chat with Oge <span className="arr">&rarr;</span>
          </OgeLaunchButton>
        </div>
      </section>
    </div>
  );
}
