/**
 * The 404 page, in the same design language as every other page on the site.
 *
 * It used to be a bare container on a white background: an eyebrow, a heading, two buttons and no
 * hero, which made the one page a visitor reaches by accident the one page that looks like it
 * belongs to a different site. A 404 is a page a real person lands on after following a link that
 * broke, and looking unfinished at that moment reads as a site that is unfinished.
 *
 * It carries the dark hero and the band layout the rest of the site uses, and it does the job a 404
 * is actually for: not apologising, but offering the handful of places the visitor was probably
 * trying to reach. The links are the site's real sections rather than a single "go home", because
 * somebody who wanted a service page is not helped by being sent to the top.
 */
import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@nexoris/seo";

export const metadata: Metadata = buildMetadata({
  title: "Page not found",
  description:
    "The page you were looking for has moved or never existed. Here is where to find what you need on the Nexoris Technologies site.",
  path: "/404",
  /*
   * A 404 is never a page to index, whatever it links to.
   *
   * Next emits its own `noindex` on the not-found boundary, so this page carries two robots tags
   * where every other page carries one. That is deliberate: both say noindex, so a crawler reads
   * the same instruction either way, and dropping this one would leave the directive resting on
   * framework behaviour we do not control. An untidy duplicate on the 404 is a smaller price than a
   * 404 that could quietly become indexable.
   */
  noindex: true,
});

/** The places somebody who hit a dead end is most likely to have been heading for. */
/**
 * Where a lost visitor most likely meant to go.
 *
 * There were six of these and two of them — /services and /industries — were themselves 404s: the
 * page that exists to rescue somebody from a dead link was offering two more. Neither path is a real
 * page on this site; services are individual pages reached from the header, and the home page groups
 * them.
 *
 * Four is enough. Each answers a different reason for being here: what we do, proof that we do it,
 * what we have written, and how to reach a person.
 */
const DESTINATIONS: { href: string; title: string; text: string }[] = [
  {
    href: "/#services",
    title: "What we do",
    text: "Custom software, websites, apps, automation, and the AI worth building in.",
  },
  {
    href: "/case-studies/",
    title: "Case studies",
    text: "Work we have delivered, what changed for the business, and how it was built.",
  },
  {
    href: "/insights/",
    title: "Insights",
    text: "Writing on software, cost and automation, for the person making the decision.",
  },
  {
    href: "/contact/",
    title: "Contact",
    text: "Tell us what you are trying to build. A real person reads every brief.",
  },
];

export default function NotFound(): ReactNode {
  return (
    <div className="svc-page">
      <section className="hero" aria-label="Page not found">
        <div className="glow" />
        <div className="wrap">
          <nav className="crumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span className="sep">/</span>
            <span className="here">Page not found</span>
          </nav>
          <div className="nf-head">
            <span className="nf-code" aria-hidden="true">
              404
            </span>
            <h1>We could not find that page.</h1>
            <p>
              The page has moved, or the link that brought you here was wrong. Nothing is broken on
              your side. Here are the places people usually mean.
            </p>
            <div className="nf-actions">
              <Link className="btn btn-primary" href="/">
                Go to the home page
              </Link>
              <Link className="btn btn-ghost on-dark" href="/contact">
                Start a project
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="band" aria-label="Where to go next">
        <div className="wrap">
          <h2 className="nf-next">Where to go next</h2>
          <div className="nf-grid">
            {DESTINATIONS.map((d) => (
              <Link className="nf-card" href={d.href} key={d.href}>
                <h3>{d.title}</h3>
                <p>{d.text}</p>
                <span className="nf-go" aria-hidden="true">
                  →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
