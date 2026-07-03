"use client";
/**
 * Product Builder hero widget for AI Product Development. Three tabs — Website, Web App, Mobile App
 * — each showing a real screenshot the owner provided (optimised to WebP by next/image), framed in
 * the Nexoris Technologies brand ink/purple. A segmented control switches tabs; auto-cycles and
 * pauses on click. All three tabs share one stage height so the layout never jumps and the website
 * and web app capture more of the design. Fully responsive down to 280px.
 */
import { useEffect, useRef, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import Image from "next/image";
import { Globe, LayoutDashboard, Smartphone } from "lucide-react";

type Icon = ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
type TypeId = "website" | "webapp" | "mobile";

/** Shared stage height across all three tabs. */
const STAGE = "h-[clamp(400px,58vw,540px)]";

const TYPES: {
  id: TypeId;
  label: string;
  icon: Icon;
  src: string;
  alt: string;
  url: string;
}[] = [
  {
    id: "website",
    label: "Website",
    icon: Globe,
    src: "/services/pb-website.png",
    alt: "A corporate advisory website built by Nexoris Technologies",
    url: "nexoristech.com",
  },
  {
    id: "webapp",
    label: "Web App",
    icon: LayoutDashboard,
    src: "/services/pb-webapp.png",
    alt: "A finance and operations dashboard built by Nexoris Technologies",
    url: "app.nexoristech.com",
  },
  {
    id: "mobile",
    label: "Mobile App",
    icon: Smartphone,
    src: "/services/pb-mobile.jpg",
    alt: "A mobile app built by Nexoris Technologies",
    url: "",
  },
];

export function ProductBuilder(): ReactNode {
  const [active, setActive] = useState<TypeId>("webapp");
  const paused = useRef(false);
  const resumeRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const next = (prev: TypeId): TypeId =>
    TYPES[(TYPES.findIndex((x) => x.id === prev) + 1) % TYPES.length]!.id;

  useEffect(() => {
    const t = setTimeout(() => {
      if (!paused.current) setActive(next);
    }, 5000);
    return () => clearTimeout(t);
  }, [active]);

  useEffect(() => () => clearTimeout(resumeRef.current), []);

  function pick(id: TypeId): void {
    paused.current = true;
    setActive(id);
    clearTimeout(resumeRef.current);
    resumeRef.current = setTimeout(() => {
      paused.current = false;
      setActive(next);
    }, 12000);
  }

  const current = TYPES.find((t) => t.id === active)!;

  return (
    <div className="hero-product-builder reveal" aria-label="What Nexoris Technologies can build for you">
      {/* Segmented control */}
      <div
        role="tablist"
        aria-label="Product type"
        className="!mb-3.5 flex w-full gap-1 rounded-xl border border-white/10 bg-white/[0.04] !p-1"
      >
        {TYPES.map((t) => {
          const on = active === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={on}
              onClick={() => pick(t.id)}
              className={`flex min-w-0 flex-1 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-lg !px-2 !py-2.5 text-[10px] font-600 transition-colors sm:!px-3 sm:!py-3 sm:text-xs ${
                on
                  ? "bg-purple-600 text-white shadow-[0_4px_14px_rgba(84,60,218,.4)]"
                  : "text-purple-100/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              <t.icon size={13} strokeWidth={2} className="!hidden shrink-0 sm:!block" />
              <span className="truncate">{t.label}</span>
            </button>
          );
        })}
      </div>

      {active === "mobile" ? (
        /* Phone screenshot presented on its own, no backdrop */
        <div className={`flex items-center justify-center ${STAGE}`}>
          <div className="relative h-full aspect-[390/844] overflow-hidden rounded-[30px] border-[6px] border-ink-950 bg-ink-950 shadow-[0_28px_70px_rgba(13,10,28,.55)] ring-1 ring-white/10">
            <Image
              src={current.src}
              alt={current.alt}
              fill
              sizes="(max-width: 1024px) 60vw, 240px"
              className="object-cover"
            />
          </div>
        </div>
      ) : (
        /* Website / Web App screenshot inside a brand browser frame */
        <div
          className={`flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-ink-950 shadow-[0_30px_80px_rgba(13,10,28,.55)] ring-1 ring-white/5 ${STAGE}`}
        >
          <div className="flex shrink-0 items-center gap-3 border-b border-white/10 bg-white/[0.04] !px-3 !py-2.5 sm:!px-4">
            <div className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
            </div>
            <div className="!mx-auto flex max-w-full items-center gap-2 truncate rounded-md bg-white/[0.06] !px-3 !py-1 text-[10px] text-purple-100/70 sm:text-[11px]">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-mint-400" />
              <span className="truncate">{current.url}</span>
            </div>
          </div>
          <div className="relative w-full flex-1 bg-white">
            <Image
              src={current.src}
              alt={current.alt}
              fill
              sizes="(max-width: 1024px) 100vw, 46vw"
              className="object-cover object-top"
            />
          </div>
        </div>
      )}
    </div>
  );
}
