"use client";
/**
 * Share buttons, and the beacon that records a read.
 *
 * The view is counted here rather than on the server because the server does not see most reads:
 * these pages are statically generated and revalidated on a timer, so one render serves many
 * visitors. The browser is the only place a page view is actually observable.
 *
 * Once per article per browser session. A reader who scrolls back up, opens a second tab, or comes
 * back from a link in the same sitting is one read, and counting each of those separately is how a
 * "views" figure quietly becomes a number nobody trusts. It is a rough count and it is meant to be:
 * anything finer belongs in the analytics the site already has, where a visitor can refuse it.
 */
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import "../styles/share.css";

type Channel = "x" | "linkedin" | "whatsapp" | "email" | "copy";

/*
 * With the trailing slash.
 *
 * The site redirects a path without one, and a redirect turns a POST into a GET without its body:
 * the beacon answered 200, changed nothing, and looked like it had worked.
 */
const ENDPOINT = "/api/insights/engage/";

function send(slug: string, kind: "view" | "share", channel?: Channel): void {
  const body = JSON.stringify({ slug, kind, ...(channel ? { channel } : {}) });
  // sendBeacon survives the page being closed by the click that opened the share window.
  if (kind === "share" && typeof navigator.sendBeacon === "function") {
    navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "application/json" }));
    return;
  }
  void fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => undefined);
}

export function ArticleEngage({ slug, title }: { slug: string; title: string }): ReactNode {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const key = `nx-read:${slug}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // Private mode, or storage refused. Counting anyway is better than not counting at all.
    }
    send(slug, "view");
  }, [slug]);

  const url = typeof window === "undefined" ? "" : window.location.href;
  const share = (channel: Channel, href: string): void => {
    send(slug, "share", channel);
    window.open(href, "_blank", "noopener,noreferrer");
  };

  const copy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      send(slug, "share", "copy");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const enc = encodeURIComponent;
  return (
    <div className="share-row">
      <span className="share-label">Share this article</span>
      <div className="share-btns">
        <button type="button" className="share-btn" aria-label="Share on X"
          onClick={() => share("x", `https://twitter.com/intent/tweet?text=${enc(title)}&url=${enc(url)}`)}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3h4.2l4.6 6.3L17.4 3H21l-7 8.6L21.4 21h-4.2l-5-6.8L6.4 21H3l7.3-9L3 3z" /></svg>
          <span>X</span>
        </button>
        <button type="button" className="share-btn" aria-label="Share on LinkedIn"
          onClick={() => share("linkedin", `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`)}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM9 9h3.8v1.65h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.4c0-1.3-.03-2.95-1.8-2.95-1.8 0-2.08 1.4-2.08 2.85V21H9z" /></svg>
          <span>LinkedIn</span>
        </button>
        <button type="button" className="share-btn" aria-label="Share on WhatsApp"
          onClick={() => share("whatsapp", `https://wa.me/?text=${enc(`${title} ${url}`)}`)}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a9 9 0 0 0-7.7 13.7L3 21l4.4-1.2A9 9 0 1 0 12 3z" /></svg>
          <span>WhatsApp</span>
        </button>
        <button type="button" className="share-btn" aria-label="Share by email"
          onClick={() => share("email", `mailto:?subject=${enc(title)}&body=${enc(url)}`)}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18v12H3z" /><path d="M3 7l9 6 9-6" /></svg>
          <span>Email</span>
        </button>
        <button type="button" className="share-btn" onClick={() => void copy()} aria-label="Copy link">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1" /><path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1" /></svg>
          <span>{copied ? "Copied" : "Copy link"}</span>
        </button>
      </div>
    </div>
  );
}
