/**
 * Contact page, transcribed from the approved design handoff (Contact.html): a compact centered
 * hero, the brief form (interactive, in ContactFormView), an aside with the reply promise, contact
 * channels, and a stylized office map, a "what happens next" trio, and the pre-contact FAQ.
 * Rendered inside .svc-page.contact-page to reuse the shared hero/band/faq primitives; bespoke
 * pieces use the contact- classes in styles/contact.css. Server component; ScrollFx adds reveals.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { ScrollFx } from "../home/ScrollFx.js";
import { ContactFormView } from "./ContactFormView.js";
import { WHATSAPP_HREF } from "../../content/catalogue.js";

const NEXT_STEPS = [
  {
    n: "1",
    title: "We read it properly",
    body: "A real person, not an autoresponder, and you hear back within one business day.",
  },
  {
    n: "2",
    title: "A short call",
    body: "Usually thirty minutes, to understand the problem behind the request. You do the talking.",
  },
  {
    n: "3",
    title: "A written proposal",
    body: "Scope, milestones, and honest numbers. You decide from there, with no pressure from us.",
  },
];

const FAQS = [
  {
    q: "Is my project too small for you?",
    a: "Probably not. We build single websites and multi-year platforms with the same process. If we are genuinely not the right fit, we will say so and point you somewhere better.",
  },
  {
    q: "How quickly can you start?",
    a: "Discovery can usually begin within one to two weeks of an agreed scope. If your timeline is tight, say so in the brief and we will tell you honestly what is possible.",
  },
  {
    q: "Will you sign an NDA?",
    a: "Yes, happily, before you share anything sensitive.",
  },
  {
    q: "We are not in Lagos. Does that matter?",
    a: "No. We work with clients across Nigeria and abroad. Calls, demos, and delivery all run the same way remotely.",
  },
  {
    q: "Who owns the work at the end?",
    a: "You do, completely. All source code, designs, and project files are handed over at handover. Nothing is held back.",
  },
];

export function ContactView(): ReactNode {
  return (
    <div className="svc-page contact-page">
      <ScrollFx />

      {/* HERO */}
      <section className="hero" aria-label="Contact Nexoris Technologies">
        <div className="glow" />
        <div className="wrap">
          <nav className="crumb reveal" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span className="sep">/</span>
            <span className="here">Contact</span>
          </nav>
          <div className="hero-inner reveal">
            <span className="kicker on-dark">
              <span className="dot" />
              Start a project
            </span>
            <h1>Tell us what you are trying to achieve.</h1>
            <p className="lede">
              Share what you are trying to achieve. We will reply within one business day with a
              short scoping call, a suggested approach, and a realistic sense of timeline and cost.
              There is no obligation on your part.
            </p>
          </div>
        </div>
      </section>

      {/* FORM + ASIDE */}
      <section className="band" aria-label="Contact form">
        <div className="wrap">
          <div className="contact-grid">
            <ContactFormView />

            <aside className="c-aside">
              <div className="aside-card resp reveal">
                <h3>Our promise</h3>
                <div className="resp-big">Reply within 1 business day</div>
                <p>
                  A short call, a suggested approach, and a realistic sense of timeline and cost. No
                  obligation.
                </p>
              </div>

              <div className="aside-card reveal">
                <h3>Other ways to reach us</h3>
                {/* Click to chat. The number was only ever reachable as a tel: link and inside one Oge
                    error state, so the quickest channel for most Nigerian buyers was the hidden one. */}
                <a className="chan" href={WHATSAPP_HREF} target="_blank" rel="noopener noreferrer">
                  <span className="ch-ic">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2zm5.8 14.2c-.2.7-1.4 1.3-2 1.4-.5.1-1.1.1-1.8-.1-.4-.1-1-.3-1.7-.6-3-1.3-4.9-4.3-5-4.5-.2-.2-1.2-1.6-1.2-3s.7-2.1 1-2.4c.2-.3.6-.4.8-.4h.6c.2 0 .4 0 .7.5l.9 2.1c.1.2.1.4 0 .6l-.4.5-.3.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.2 1.4 2.5 1.5.3.1.4.1.6-.1l.9-1c.2-.2.4-.2.6-.1l2 1c.3.1.5.2.5.3.1.2.1.8-.1 1.5z"/></svg>
                  </span>
                  <span>
                    <span className="ch-l">WhatsApp</span>
                    <span className="ch-v">Chat with us now</span>
                  </span>
                </a>
                <a className="chan" href="tel:+2349138133224">
                  <span className="ch-ic">
                    <svg viewBox="0 0 24 24">
                      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />
                    </svg>
                  </span>
                  <span>
                    <span className="ch-l">Phone</span>
                    <span className="ch-v">+234 913 813 3224</span>
                  </span>
                </a>
                <a className="chan" href="mailto:hello@nexoristech.com">
                  <span className="ch-ic">
                    <svg viewBox="0 0 24 24">
                      <rect x="3" y="5" width="18" height="14" rx="2" />
                      <path d="M4 7l8 6 8-6" />
                    </svg>
                  </span>
                  <span>
                    <span className="ch-l">General questions</span>
                    <span className="ch-v">hello@nexoristech.com</span>
                  </span>
                </a>
                <a className="chan" href="mailto:business@nexoristech.com">
                  <span className="ch-ic">
                    <svg viewBox="0 0 24 24">
                      <path d="M3 7h18v12H3zM8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </span>
                  <span>
                    <span className="ch-l">New business</span>
                    <span className="ch-v">business@nexoristech.com</span>
                  </span>
                </a>
              </div>

              <div className="aside-card addr-card reveal">
                <h3>Visit us</h3>
                <div
                  className="addr-map"
                  role="img"
                  aria-label="Map showing the Nexoris Technologies office in Ajah, Lekki Lagos"
                >
                  <div className="map-grid" />
                  <span className="road r1" />
                  <span className="road r2" />
                  <span className="road r3" />
                  <span className="pin">
                    <svg viewBox="0 0 24 24" fill="var(--purple-600)" stroke="#fff" strokeWidth="1.5">
                      <path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7z" />
                      <circle cx="12" cy="9" r="2.4" fill="#fff" stroke="none" />
                    </svg>
                  </span>
                </div>
                <p className="addr-txt">
                  <b>Nexoris Technologies Ltd</b>No. 5, Mojisola Dokpesi Street, Ajah, Lekki Lagos
                  State.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* NEXT STEPS */}
      <section className="band soft" aria-label="What happens next">
        <div className="wrap">
          <div className="band-head reveal">
            <span className="kicker">
              <span className="dot" />
              What happens next
            </span>
            <h2 className="h-section">What happens after you send this.</h2>
          </div>
          <div className="next-grid reveal">
            {NEXT_STEPS.map((s) => (
              <article className="next-step" key={s.n}>
                <div className="ns-n">{s.n}</div>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="band" aria-label="Frequently asked questions">
        <div className="wrap">
          <div className="faq-head reveal">
            <span className="kicker">
              <span className="dot" />
              Before you write
            </span>
            <h2>Worth knowing before you write.</h2>
            <p className="lede">
              A few honest answers to the questions people ask most before getting in touch.
            </p>
          </div>
          <div className="faq-wrap reveal">
            {FAQS.map((f) => (
              <details className="faq" key={f.q}>
                <summary>
                  {f.q} <span className="fq-pm">+</span>
                </summary>
                <div className="faq-a">{f.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
