"use client";
/**
 * AI E-Commerce hero widget. A smart storefront preview: a platform toggle (Custom, Shopify,
 * WooCommerce) swaps the featured product with its price and colour-coded stock state; the
 * add-to-cart button gives a brief "Added" confirmation; recommendations and a cart-recovery toast
 * round it out. Auto-cycles the platforms, pausing on interaction. Styling: styles/store-widget.css.
 */
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

type PlatformId = "custom" | "shopify" | "woo";

interface Platform {
  id: PlatformId;
  label: string;
  name: string;
  price: string;
  stock: string;
  stockColor: string;
  img: string;
}

const PLATFORMS: Platform[] = [
  {
    id: "custom",
    label: "Custom",
    name: "Ankara Weekend Tote",
    price: "₦24,500",
    stock: "In stock · reorder set",
    stockColor: "#0b6b45",
    img: "linear-gradient(135deg,#6A55F2,#543CDA)",
  },
  {
    id: "shopify",
    label: "Shopify",
    name: "Shea Glow Gift Set",
    price: "₦18,900",
    stock: "Low stock · forecast flagged",
    stockColor: "#8a5a00",
    img: "linear-gradient(135deg,#168F7C,#34b39e)",
  },
  {
    id: "woo",
    label: "WooCommerce",
    name: "Cold Brew Subscription",
    price: "₦9,500/mo",
    stock: "Recurring · auto-renews",
    stockColor: "#543CDA",
    img: "linear-gradient(135deg,#8A45D0,#a86ae0)",
  },
];

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
      if (!paused.current) setActive(nextId);
    }, 4500);
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
    clearTimeout(resumeRef.current);
    resumeRef.current = setTimeout(() => {
      paused.current = false;
      setActive(nextId);
    }, 12000);
  }

  function addToCart(): void {
    setAdded(true);
    clearTimeout(addedRef.current);
    addedRef.current = setTimeout(() => setAdded(false), 1700);
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
        <div className="storew-prod">
          <div className="storew-img" style={{ background: p.img }} />
          <div>
            <h4>{p.name}</h4>
            <div className="pr">{p.price}</div>
            <span className="stk" style={{ color: p.stockColor }}>
              <i />
              <span>{p.stock}</span>
            </span>
          </div>
        </div>

        <button
          type="button"
          className={`storew-add${added ? " added" : ""}`}
          onClick={addToCart}
        >
          {added ? (
            <>
              <svg viewBox="0 0 24 24">
                <path d="M4 12l5 5L20 6" />
              </svg>
              Added to cart
            </>
          ) : (
            "Add to cart"
          )}
        </button>

        <div className="storew-rec">
          <div className="rl">Recommended for this shopper</div>
          <div className="rrow">
            <div className="rc">
              <div className="ri" />
              <span>Matched</span>
            </div>
            <div className="rc">
              <div className="ri" />
              <span>Often paired</span>
            </div>
            <div className="rc">
              <div className="ri" />
              <span>Trending</span>
            </div>
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
