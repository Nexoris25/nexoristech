/**
 * One article card, used everywhere an article is listed.
 *
 * There were three of these: the Insights hub, the author profile, and the home page — the first two
 * near-identical copies of the same markup, the third a different component (`.ins-card`) with a
 * different shape, different metadata and initials in place of the author's face. So the same article
 * looked like a different thing depending on which page you found it on, and a change to the card had
 * to be made three times and was twice forgotten.
 *
 * The author profile passes its own author rather than the article's, because every article on that
 * page is by that person and the card should say so even where the article's own byline is missing.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import type { InsightCard } from "../../lib/cms.js";
import { formatLagosDate } from "../../lib/date.js";

export interface ArticleCardProps {
  article: InsightCard;
  /** Overrides the article's own byline, for a page that is already about one author. */
  author?: { name: string; photoUrl?: string };
}

export function ArticleCard({ article, author }: ArticleCardProps): ReactNode {
  const name = author?.name ?? article.author;
  const photo = author ? author.photoUrl : article.authorPhotoUrl;
  const href = `/insights/${article.slug}`;

  return (
    <article className="card">
      {/* The thumbnail repeats the title link, so it is hidden from assistive technology and taken
          out of the tab order rather than read out and tabbed through twice. */}
      <Link className="thumb" href={href} aria-hidden="true" tabIndex={-1}>
        {article.coverUrl ? <img src={article.coverUrl} alt={article.coverAlt ?? ""} loading="lazy" /> : null}
        {article.category ? <span className="card-cat">{article.category}</span> : null}
      </Link>
      <div className="card-body">
        <h3>
          <Link href={href}>{article.title}</Link>
        </h3>
        {article.excerpt ? <p className="card-ex">{article.excerpt}</p> : null}
        <div className="card-foot">
          {name ? (
            <span className="card-by">
              {photo ? (
                <img className="card-av" src={photo} alt="" loading="lazy" />
              ) : (
                <span className="card-av card-av-fb" aria-hidden="true">
                  {name.trim().charAt(0).toUpperCase()}
                </span>
              )}
              <span className="card-byname">{name}</span>
            </span>
          ) : (
            <span />
          )}
          {/* Date and reading time together: how current it is and what it will cost to read, which
              is the pair a reader weighs before opening anything. */}
          <span className="card-meta">
            {article.publishedAt ? <span>{formatLagosDate(article.publishedAt)}</span> : null}
            {article.publishedAt && article.readMinutes ? (
              <span className="card-dot" aria-hidden="true">·</span>
            ) : null}
            {article.readMinutes ? <span>{article.readMinutes} min read</span> : null}
          </span>
        </div>
        <Link className="card-go" href={href} tabIndex={-1}>
          Read article <span className="arr" aria-hidden="true">&rarr;</span>
        </Link>
      </div>
    </article>
  );
}
