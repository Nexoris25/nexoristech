"use client";
/**
 * AI E-Commerce hero widget. A realistic smart-storefront preview: a platform toggle (Custom,
 * Shopify, WooCommerce) swaps the featured product, each shown as a detailed product illustration
 * with a rating, sale price, and colour-coded stock state. The add-to-cart button gives a brief
 * "Added" confirmation; recommendation thumbnails and a cart-recovery toast round it out.
 * Auto-cycles the platforms, pausing on interaction. Styling: styles/store-widget.css.
 */
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

type PlatformId = "custom" | "shopify" | "woo";

/* ── Product illustrations (flat, viewBox 0 0 120 120) ── */

const ToteArt = (
  <svg className="art" viewBox="0 0 120 120" role="img" aria-label="Ankara print tote bag">
    <ellipse cx="60" cy="106" rx="34" ry="5" fill="#0d0a1c" opacity="0.1" />
    <path d="M44 50 C44 27 76 27 76 50" fill="none" stroke="#7a6743" strokeWidth="5" strokeLinecap="round" />
    <defs>
      <clipPath id="toteclip">
        <path d="M32 50 H88 L92 100 A5 5 0 0 1 87 105 H33 A5 5 0 0 1 28 100 Z" />
      </clipPath>
    </defs>
    <g clipPath="url(#toteclip)">
      <rect x="28" y="50" width="64" height="56" fill="#2a1e63" />
      <rect x="28" y="60" width="64" height="9" fill="#e8862e" />
      <rect x="28" y="84" width="64" height="9" fill="#158f7c" />
      {[36, 48, 60, 72, 84].map((x) => (
        <path key={`d1-${x}`} d={`M${x} 71 l4 4 -4 4 -4 -4 z`} fill="#e7b53b" />
      ))}
      {[36, 48, 60, 72, 84].map((x) => (
        <path key={`d2-${x}`} d={`M${x} 98 l3.5 3.5 -3.5 3.5 -3.5 -3.5 z`} fill="#e8862e" />
      ))}
      {[42, 54, 66, 78].map((x) => (
        <circle key={`c-${x}`} cx={x} cy="55" r="2.2" fill="#e7b53b" />
      ))}
    </g>
    <path
      d="M32 50 H88 L92 100 A5 5 0 0 1 87 105 H33 A5 5 0 0 1 28 100 Z"
      fill="none"
      stroke="#1a1240"
      strokeWidth="2"
    />
  </svg>
);

const SheaArt = (
  <svg className="art" viewBox="0 0 120 120" role="img" aria-label="Shea butter jar and pump bottle gift set">
    <ellipse cx="60" cy="106" rx="36" ry="5" fill="#0d0a1c" opacity="0.1" />
    {/* jar */}
    <rect x="30" y="70" width="42" height="34" rx="7" fill="#f3e9da" />
    <rect x="30" y="63" width="42" height="12" rx="5" fill="#c99f52" />
    <rect x="36" y="82" width="30" height="14" rx="3" fill="#fff" opacity="0.75" />
    <path d="M41 89 h20 M41 92.5 h13" stroke="#c9a06a" strokeWidth="1.4" strokeLinecap="round" />
    {/* pump bottle */}
    <rect x="78" y="58" width="26" height="46" rx="7" fill="#efe2ce" />
    <rect x="86" y="42" width="10" height="17" rx="2" fill="#c99f52" />
    <rect x="84" y="38" width="14" height="6" rx="2" fill="#c99f52" />
    <rect x="82" y="72" width="18" height="16" rx="2" fill="#fff" opacity="0.72" />
    {/* leaf accent */}
    <path d="M50 62 q9 -13 22 -10 q-5 13 -22 10 z" fill="#3e8e6e" />
    <path d="M52 61 q9 -6 18 -8" fill="none" stroke="#2f6f54" strokeWidth="1.2" />
  </svg>
);

const BrewArt = (
  <svg className="art" viewBox="0 0 120 120" role="img" aria-label="Cold brew coffee bottle with straw">
    <ellipse cx="60" cy="106" rx="26" ry="5" fill="#0d0a1c" opacity="0.1" />
    <defs>
      <clipPath id="brewclip">
        <path d="M50 44 h20 v9 l5 9 v38 a7 7 0 0 1 -7 7 h-16 a7 7 0 0 1 -7 -7 v-38 l5 -9 z" />
      </clipPath>
    </defs>
    <path
      d="M50 44 h20 v9 l5 9 v38 a7 7 0 0 1 -7 7 h-16 a7 7 0 0 1 -7 -7 v-38 l5 -9 z"
      fill="#efeaf7"
      stroke="#d8d2e6"
      strokeWidth="1.5"
    />
    <g clipPath="url(#brewclip)">
      <rect x="40" y="72" width="40" height="42" fill="#4a2c1a" />
      <rect x="40" y="72" width="40" height="7" fill="#c9a27a" />
      <rect x="52" y="80" width="9" height="9" rx="2" fill="#fff" opacity="0.28" transform="rotate(12 56 84)" />
      <rect x="62" y="92" width="8" height="8" rx="2" fill="#fff" opacity="0.22" transform="rotate(-10 66 96)" />
    </g>
    <rect x="49" y="38" width="22" height="9" rx="3" fill="#543cda" />
    <rect x="72" y="28" width="4.5" height="46" rx="2" fill="#e8862e" transform="rotate(9 74 51)" />
    <rect x="47" y="88" width="26" height="16" rx="3" fill="#fff" opacity="0.9" />
    <path d="M52 95 h16 M52 99 h10" stroke="#8a5a00" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

/* ── Recommendation thumbnails (viewBox 0 0 48 48) ── */

const RecTee = (
  <svg viewBox="0 0 48 48" role="img" aria-label="Folded top">
    <path d="M17 12 l7 4 7 -4 6 4 -3 6 -3 -1 v14 h-14 v-14 l-3 1 -3 -6 z" fill="#6a55f2" />
    <path d="M17 12 l7 4 7 -4" fill="none" stroke="#4330b8" strokeWidth="1.4" />
  </svg>
);
const RecBottle = (
  <svg viewBox="0 0 48 48" role="img" aria-label="Skincare bottle">
    <rect x="18" y="16" width="12" height="22" rx="4" fill="#3e8e6e" />
    <rect x="21" y="9" width="6" height="8" rx="2" fill="#c99f52" />
    <rect x="20" y="24" width="8" height="8" rx="1.5" fill="#fff" opacity="0.8" />
  </svg>
);
const RecBox = (
  <svg viewBox="0 0 48 48" role="img" aria-label="Gift box">
    <rect x="13" y="20" width="22" height="16" rx="2" fill="#e8862e" />
    <rect x="13" y="16" width="22" height="6" rx="2" fill="#d9761e" />
    <rect x="22" y="16" width="4" height="20" fill="#e7b53b" />
    <path d="M24 16 q-5 -6 -8 -2 q2 4 8 2 q6 2 8 -2 q-3 -4 -8 2 z" fill="#e7b53b" />
  </svg>
);

const RECS = [
  { art: RecTee, tag: "Matched", price: "₦12,000" },
  { art: RecBottle, tag: "Often paired", price: "₦7,500" },
  { art: RecBox, tag: "Trending", price: "₦21,000" },
];

interface Platform {
  id: PlatformId;
  label: string;
  name: string;
  price: string;
  was?: string;
  badge: string;
  rating: number;
  reviews: number;
  stock: string;
  stockColor: string;
  art: ReactNode;
}

const PLATFORMS: Platform[] = [
  {
    id: "custom",
    label: "Custom",
    name: "Ankara Weekend Tote",
    price: "₦24,500",
    was: "₦28,000",
    badge: "Bestseller",
    rating: 4.8,
    reviews: 214,
    stock: "In stock · reorder set",
    stockColor: "#0b6b45",
    art: ToteArt,
  },
  {
    id: "shopify",
    label: "Shopify",
    name: "Shea Glow Gift Set",
    price: "₦18,900",
    was: "₦22,500",
    badge: "Save 16%",
    rating: 4.7,
    reviews: 96,
    stock: "Low stock · forecast flagged",
    stockColor: "#8a5a00",
    art: SheaArt,
  },
  {
    id: "woo",
    label: "WooCommerce",
    name: "Cold Brew Subscription",
    price: "₦9,500/mo",
    badge: "Subscription",
    rating: 4.9,
    reviews: 57,
    stock: "Recurring · auto-renews",
    stockColor: "#543cda",
    art: BrewArt,
  },
];

function Stars({ rating }: { rating: number }): ReactNode {
  return (
    <span className="stars" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} viewBox="0 0 24 24" className={n <= Math.round(rating) ? undefined : "off"}>
          <path d="M12 2l2.9 6.1 6.7.8-5 4.6 1.3 6.6L12 17.6 5.8 20.7 7.1 14 2 9.4l6.7-.8z" />
        </svg>
      ))}
    </span>
  );
}

export function EcommerceStore(): ReactNode {
  const [active, setActive] = useState<PlatformId>("custom");
  const [added, setAdded] = useState(false);
  const paused = useRef(false);
  const resumeRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const addedRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const nextId = (prev: PlatformId): PlatformId =>
    PLATFORMS[(PLATFORMS.findIndex((p) => p.id === prev) + 1) % PLATFORMS.length]!.id;

  useEffect(() => {
    const t = setTimeout(() => {
      if (!paused.current) {
        setActive(nextId);
        setAdded(false);
      }
    }, 4800);
    return () => clearTimeout(t);
  }, [active]);

  useEffect(
    () => () => {
      clearTimeout(resumeRef.current);
      clearTimeout(addedRef.current);
    },
    [],
  );

  function pick(id: PlatformId): void {
    paused.current = true;
    setActive(id);
    setAdded(false);
    clearTimeout(resumeRef.current);
    resumeRef.current = setTimeout(() => {
      paused.current = false;
      setActive(nextId);
    }, 12000);
  }

  function addToCart(): void {
    setAdded(true);
    clearTimeout(addedRef.current);
    addedRef.current = setTimeout(() => setAdded(false), 1800);
  }

  const p = PLATFORMS.find((x) => x.id === active)!;

  return (
    <div className="storew reveal" aria-label="Smart storefront preview">
      <div className="storew-bar">
        <i />
        <i />
        <i />
        <span className="url">yourstore.com.ng</span>
      </div>

      <div className="storew-toggle" role="tablist" aria-label="Store platform">
        {PLATFORMS.map((pl) => (
          <button
            key={pl.id}
            type="button"
            role="tab"
            aria-selected={active === pl.id}
            className={active === pl.id ? "on" : undefined}
            onClick={() => pick(pl.id)}
          >
            {pl.label}
          </button>
        ))}
      </div>

      <div className="storew-body">
        <div className="storew-shot">
          <span className="storew-badge">{p.badge}</span>
          <span className="storew-wish">
            <svg viewBox="0 0 24 24">
              <path d="M12 21C6 16.5 3 13 3 9a4.5 4.5 0 0 1 9-1 4.5 4.5 0 0 1 9 1c0 4-3 7.5-9 12z" />
            </svg>
          </span>
          {p.art}
          <span className="storew-dots" aria-hidden="true">
            {PLATFORMS.map((pl) => (
              <i key={pl.id} className={active === pl.id ? "on" : undefined} />
            ))}
          </span>
        </div>

        <div className="storew-info">
          <h4>{p.name}</h4>
          <div className="storew-rate">
            <Stars rating={p.rating} />
            <span className="rnum">{p.rating.toFixed(1)}</span>
            <span className="rct">({p.reviews})</span>
          </div>
          <div className="storew-price">
            <span className="pr">{p.price}</span>
            {p.was ? <span className="was">{p.was}</span> : null}
          </div>
          <span className="storew-stk" style={{ color: p.stockColor }}>
            <i />
            <span>{p.stock}</span>
          </span>
        </div>

        <button type="button" className={`storew-add${added ? " added" : ""}`} onClick={addToCart}>
          {added ? (
            <>
              <svg viewBox="0 0 24 24">
                <path d="M4 12l5 5L20 6" />
              </svg>
              Added to cart
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24">
                <path d="M6 6h15l-1.5 9h-12z" />
                <circle cx="9" cy="20" r="1.4" />
                <circle cx="18" cy="20" r="1.4" />
              </svg>
              Add to cart
            </>
          )}
        </button>

        <div className="storew-rec">
          <div className="rl">Recommended for this shopper</div>
          <div className="rrow">
            {RECS.map((r) => (
              <div className="rc" key={r.tag}>
                <div className="ri">{r.art}</div>
                <span className="rt">{r.tag}</span>
                <span className="rp">{r.price}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="storew-toast">
        <span className="ti">
          <svg viewBox="0 0 24 24">
            <path d="M4 12l5 5L20 6" />
          </svg>
        </span>
        <div>
          <b>Abandoned cart recovered</b>
          <span className="ts">Reminder sent at the right moment · shopper returned</span>
        </div>
      </div>
    </div>
  );
}
