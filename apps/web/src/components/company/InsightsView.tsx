"use client";
/**
 * Insights hub, ported from the approved handoff (Insights.html) and adapted to the available data.
 * Articles come from Strapi (getAllInsightCards, passed in as cards); the hero search filters them
 * client-side, the newest is featured, and the rest form the card grid. An honest empty state shows
 * until the first article is published. Each card carries its category and the author's face, which
 * the handoff always had and the card type now supplies. The newsletter signup records
 * interest through the existing lead intake so an email is never silently dropped. Cover images are
 * remote CMS URLs, so they use a plain img (next/image can't optimize an unconfigured host).
 */
import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import Link from "next/link";
import { ScrollFx } from "../home/ScrollFx.js";
import type { InsightCard, CategoryTab } from "../../lib/cms.js";
import { formatLagosDate } from "../../lib/date.js";
import { ArticleCard as SharedArticleCard } from "../insights/ArticleCard.js";

/** Three rows of the three-column grid. */
const PAGE_SIZE = 9;

/** The shared card, so the hub, the author profile and the home page all list an article the same way. */
function ArticleCard({ a }: { a: InsightCard }): ReactNode {
  return <SharedArticleCard article={a} />;
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

export function InsightsView({ cards, categories = [] }: { cards: InsightCard[]; categories?: CategoryTab[] }): ReactNode {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const q = query.trim().toLowerCase();

  /*
   * Search and category narrow the same list, in that order.
   *
   * Both are client-side because the whole set is already on the page: a filter that costs a round
   * trip to remove three cards is a filter people stop using. The featured article steps aside as
   * soon as either is active - it is "the latest piece", which is not a claim that survives a
   * filter, and leaving it above a filtered grid shows a result that does not match the filter.
   */
  const filtered = useMemo(() => {
    let out = cards;
    if (category) out = out.filter((c) => c.categorySlug === category);
    if (q) {
      out = out.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          (c.excerpt ?? "").toLowerCase().includes(q),
      );
    }
    return out;
  }, [cards, q, category]);

  const narrowing = q.length > 0 || category.length > 0;
  const featured = !narrowing && cards.length > 0 ? cards[0] : null;
  const allGridCards = narrowing ? filtered : cards.slice(1);

  /*
   * The hub shows a page at a time.
   *
   * Rendering every published article the moment somebody opens the page is fine at nine and wrong
   * at two hundred: the images alone would be the whole download, and nobody reaching the hub has
   * asked to see the archive. A page of nine fills the three-column grid exactly three rows deep,
   * which is enough to show the range without asking anyone to commit to it.
   *
   * The count resets whenever the search or the category changes, because a reader who has just
   * narrowed the list is starting again and should not land in the middle of the previous one.
   */
  const [shown, setShown] = useState(PAGE_SIZE);
  useEffect(() => setShown(PAGE_SIZE), [q, category]);
  const gridCards = allGridCards.slice(0, shown);
  const remaining = allGridCards.length - gridCards.length;

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
              <h2>Our first articles are on the way.</h2>
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
                      <img src={featured.coverUrl} alt={featured.coverAlt ?? ""} />
                    ) : null}
                    {featured.category ? <span className="card-cat">{featured.category}</span> : null}
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
                    {/* Byline and date together: the same pair a card carries, so the featured
                        article is not the one place on the page with no author on it. */}
                    <div className="feat-meta">
                      {featured.author ? (
                        <span className="card-by">
                          {featured.authorPhotoUrl ? (
                            <img className="card-av" src={featured.authorPhotoUrl} alt="" />
                          ) : (
                            <span className="card-av card-av-fb" aria-hidden="true">
                              {featured.author.trim().charAt(0).toUpperCase()}
                            </span>
                          )}
                          <span className="card-byname">{featured.author}</span>
                        </span>
                      ) : null}
                      {featured.publishedAt ? (
                        <span className="feat-date">{formatLagosDate(featured.publishedAt)}</span>
                      ) : null}
                    </div>
                    <Link className="btn btn-primary feat-go" href={`/insights/${featured.slug}`}>
                      Read article <span className="arr">&rarr;</span>
                    </Link>
                  </div>
                </div>
              ) : null}

              {/* Category filter.
                  Tabs wrap rather than scroll: a horizontal strip on a phone hides its own last
                  option behind an edge with nothing to say it is there. They carry the category's
                  short name for the same reason - a row of full names is a paragraph. */}
              {categories.length > 0 ? (
                <div className="cat-bar" role="group" aria-label="Filter articles by category">
                  <button
                    type="button"
                    className={`cat-tab${category === "" ? " on" : ""}`}
                    aria-pressed={category === ""}
                    onClick={() => setCategory("")}
                  >
                    All
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.slug}
                      type="button"
                      className={`cat-tab${category === c.slug ? " on" : ""}`}
                      aria-pressed={category === c.slug}
                      title={c.name}
                      onClick={() => setCategory(category === c.slug ? "" : c.slug)}
                    >
                      {c.shortName}
                    </button>
                  ))}
                </div>
              ) : null}

              {narrowing ? (
                <p className="result-line" role="status">
                  <b>{filtered.length}</b> {filtered.length === 1 ? "article" : "articles"}
                  {category ? ` in ${categories.find((c) => c.slug === category)?.name ?? "this category"}` : ""}
                  {q ? ` matching “${query.trim()}”` : ""}
                </p>
              ) : null}

              {gridCards.length > 0 ? (
                <>
                  <div className="ins-grid">
                    {gridCards.map((a) => (
                      <ArticleCard a={a} key={a.slug} />
                    ))}
                  </div>
                  {remaining > 0 ? (
                    <div className="ins-more">
                      <button type="button" className="btn btn-ghost" onClick={() => setShown((n) => n + PAGE_SIZE)}>
                        Load more articles
                      </button>
                      <p className="ins-more-count" role="status">
                        Showing {gridCards.length} of {allGridCards.length}
                      </p>
                    </div>
                  ) : null}
                </>
              ) : narrowing ? (
                <div className="ins-empty">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="11" cy="11" r="7" />
                    <path d="M21 21l-4.3-4.3" />
                  </svg>
                  <h2>Nothing here yet.</h2>
                  <p>
                    {category && q
                      ? "No article in this category matches that search."
                      : category
                        ? "No published article in this category yet."
                        : "Try a different word, or clear the search to see everything."}
                  </p>
                  <button type="button" className="btn btn-ghost" onClick={() => { setCategory(""); setQuery(""); }}>
                    Show everything
                  </button>
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
