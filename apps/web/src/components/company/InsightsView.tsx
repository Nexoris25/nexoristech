"use client";
/**
 * Insights hub, ported from the approved handoff (Insights.html) and adapted to the available data.
 * Articles come from Strapi (getAllInsightCards, passed in as cards); the hero search filters them
 * client-side, the newest is featured, and the rest form the card grid. An honest empty state shows
 * until the first article is published. The category bar and per-card author avatars in the handoff
 * are omitted because InsightCard carries no category or author. The newsletter signup records
 * interest through the existing lead intake so an email is never silently dropped. Cover images are
 * remote CMS URLs, so they use a plain img (next/image can't optimize an unconfigured host).
 */
import { useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import Link from "next/link";
import { ScrollFx } from "../home/ScrollFx.js";
import type { InsightCard } from "../../lib/cms.js";
import { formatLagosDate } from "../../lib/date.js";

function ArticleCard({ a }: { a: InsightCard }): ReactNode {
  return (
    <article className="card">
      <span className="thumb">
        {a.coverUrl ? (
          <img src={a.coverUrl} alt={`Cover image for the article ${a.title}`} loading="lazy" />
        ) : null}
      </span>
      <div className="card-body">
        <h3>
          <Link href={`/insights/${a.slug}`}>{a.title}</Link>
        </h3>
        {a.excerpt ? <p className="card-ex">{a.excerpt}</p> : null}
        <span className="card-cta">
          Read article <span className="arr">&rarr;</span>
        </span>
      </div>
    </article>
  );
}

function NewsletterSignup(): ReactNode {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const value = email.trim();
    if (!value || submitting) return;
    setSubmitting(true);
    setError(false);
    try {
      const response = await fetch("/api/contact/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "newsletter",
          page: "/insights",
          name: value,
          email: value,
          message: "Newsletter subscription request from the Insights page.",
        }),
      });
      if (!response.ok) throw new Error("intake");
      setDone(true);
    } catch {
      setError(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="nl reveal">
      <div className="nl-c">
        <span className="kicker on-dark">
          <span className="dot" />
          Newsletter
        </span>
        <h2>Get our new articles by email.</h2>
        <p>
          We will send you an email when we publish something on software, automation, or AI for
          businesses in Nigeria and beyond. You can unsubscribe whenever you like.
        </p>
      </div>
      <form className="nl-form" onSubmit={onSubmit}>
        <label htmlFor="nl-email">Your email address</label>
        <div className="nl-row">
          <input
            id="nl-email"
            type="email"
            name="email"
            placeholder="you@company.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "Sending" : "Subscribe"}
          </button>
        </div>
        {done ? (
          <p className="nl-ok" role="status">
            Thank you. We will be in touch when the first articles go out.
          </p>
        ) : null}
        {error ? (
          <p className="nl-ok" role="alert" style={{ color: "#f3b0c0" }}>
            That did not go through. Please email hello@nexoristech.com and we will add you.
          </p>
        ) : null}
      </form>
    </div>
  );
}

export function InsightsView({ cards }: { cards: InsightCard[] }): ReactNode {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!q) return cards;
    return cards.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        (c.excerpt ?? "").toLowerCase().includes(q),
    );
  }, [cards, q]);

  const searching = q.length > 0;
  const featured = !searching && cards.length > 0 ? cards[0] : null;
  const gridCards = searching ? filtered : cards.slice(1);

  return (
    <div className="svc-page insights-page">
      <ScrollFx />

      {/* HERO */}
      <section className="hero" aria-label="Insights">
        <div className="glow" />
        <div className="wrap">
          <nav className="crumb reveal" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span className="sep">/</span>
            <span className="here">Insights</span>
          </nav>
          <div className="hero-inner reveal">
            <span className="kicker on-dark">
              <span className="dot" />
              Insights
            </span>
            <h1>Ideas worth your time.</h1>
            <p className="lede">
              Practical writing on software, automation, and AI for businesses in Nigeria and beyond.
            </p>
            <div className="search" role="search">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.3-4.3" />
              </svg>
              <input
                type="search"
                aria-label="Search insights"
                placeholder="Search articles"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* BODY */}
      <section className="band" aria-label="Articles">
        <div className="wrap">
          {cards.length === 0 ? (
            <div className="ins-empty reveal">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 5h16v14H4z" />
                <path d="M8 9h8M8 13h5" />
              </svg>
              <h3>Our first articles are on the way.</h3>
              <p>
                In the meantime, tell us what you are working on and we will point you in the right
                direction. Write to <a href="mailto:hello@nexoristech.com">hello@nexoristech.com</a>.
              </p>
            </div>
          ) : (
            <>
              {featured ? (
                <div className="feat reveal">
                  <Link className="feat-thumb" href={`/insights/${featured.slug}`} aria-label={featured.title}>
                    {featured.coverUrl ? (
                      <img src={featured.coverUrl} alt={`Cover image for the article ${featured.title}`} />
                    ) : null}
                  </Link>
                  <div className="feat-body">
                    <span className="ed-pick">
                      <svg viewBox="0 0 24 24">
                        <path d="M12 3l1.9 4.6L19 9l-4.6 1.9L12 16l-1.9-4.6L5 9l5.1-1.4z" />
                      </svg>
                      Latest
                    </span>
                    <h2>
                      <Link href={`/insights/${featured.slug}`}>{featured.title}</Link>
                    </h2>
                    {featured.excerpt ? <p>{featured.excerpt}</p> : null}
                    {featured.publishedAt ? (
                      <div className="feat-date">{formatLagosDate(featured.publishedAt)}</div>
                    ) : null}
                    <Link className="btn btn-primary feat-go" href={`/insights/${featured.slug}`}>
                      Read article <span className="arr">&rarr;</span>
                    </Link>
                  </div>
                </div>
              ) : null}

              {searching ? (
                <p className="result-line" role="status" style={{ marginTop: "40px" }}>
                  <b>{filtered.length}</b> {filtered.length === 1 ? "result" : "results"} for &ldquo;
                  {query.trim()}&rdquo;
                </p>
              ) : null}

              {gridCards.length > 0 ? (
                <div className="ins-grid">
                  {gridCards.map((a) => (
                    <ArticleCard a={a} key={a.slug} />
                  ))}
                </div>
              ) : searching ? (
                <div className="ins-empty">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="11" cy="11" r="7" />
                    <path d="M21 21l-4.3-4.3" />
                  </svg>
                  <h3>No articles match that search.</h3>
                  <p>Try a different word, or clear the search to see everything.</p>
                </div>
              ) : null}
            </>
          )}
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="band soft" aria-label="Newsletter">
        <div className="wrap">
          <NewsletterSignup />
        </div>
      </section>
    </div>
  );
}
