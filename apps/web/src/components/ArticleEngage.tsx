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

export function ArticleEngage({
  slug,
  title,
  url,
}: {
  slug: string;
  title: string;
  /**
   * The canonical, absolute address of this article, resolved on the server.
   *
   * Shares used to be built from `window.location.href`, which is whatever the reader is currently
   * on. Behind the proxy that is http, so every share — and every copied link — carried the
   * insecure form of the URL out to X, LinkedIn and WhatsApp, where it is what recipients click and
   * what the platform keeps. It also carried any query string or hash the reader happened to have.
   */
  url: string;
}): ReactNode {
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

  const share = (channel: Channel, href: string): void => {
    send(slug, "share", channel);
    window.open(href, "_blank", "noopener,noreferrer");
  };

  const copy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(url);
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
        <button type="button" className="share-btn share-btn-glyph" aria-label="Share on X"
          onClick={() => share("x", `https://twitter.com/intent/tweet?text=${enc(title)}&url=${enc(url)}`)}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3h4.2l4.6 6.3L17.4 3H21l-7 8.6L21.4 21h-4.2l-5-6.8L6.4 21H3l7.3-9L3 3z" /></svg>
          <span>X</span>
        </button>
        <button type="button" className="share-btn" aria-label="Share on LinkedIn"
          onClick={() => share("linkedin", `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`)}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM9 9h3.8v1.65h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.4c0-1.3-.03-2.95-1.8-2.95-1.8 0-2.08 1.4-2.08 2.85V21H9z" /></svg>
          <span>LinkedIn</span>
        </button>
        {/* WhatsApp's own mark: the speech bubble with the handset, not the plain bubble that was
            here before — that outline was any messaging app at all. A filled brand glyph, so it
            takes the glyph treatment rather than the stroked one. */}
        <button type="button" className="share-btn share-btn-glyph" aria-label="Share on WhatsApp"
          onClick={() => share("whatsapp", `https://wa.me/?text=${enc(`${title} ${url}`)}`)}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
            <path d="M20.52 3.449A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.423-8.452zm-8.468 18.288h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884z" />
          </svg>
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
