/**
 * The home industries section (PRD 12). Rather than 20 equal tiles in one flat grid, the 20
 * industry pages are organised into the four catalogue groups, each a card with its own
 * photograph and a tidy list of the industries inside it. This reads far better on mobile, where
 * the four cards simply stack, and it gives a first-time visitor a sense of the spread without a
 * wall of buttons. Every link points to a real hardcoded industry page, so nothing is fabricated.
 */
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { industryGroups } from "../content/catalogue.js";
import { fallbackPhoto, img, industryGroupPhotos } from "../content/media.js";

export function IndustriesGrid(): ReactNode {
  return (
    <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
      {industryGroups.map((group) => {
        const photo = industryGroupPhotos[group.heading] ?? fallbackPhoto;
        return (
          <section
            key={group.heading}
            aria-label={group.heading}
            className="card-surface flex flex-col overflow-hidden !p-0"
          >
            <div className="relative h-36 w-full overflow-hidden">
              <Image
                src={img(photo.id, 800)}
                alt={photo.alt}
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
              {/* Ink wash keeps the white heading legible over any photograph. */}
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-ink-950/85 via-ink-950/35 to-transparent"
              />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5">
                <h3 className="font-jakarta text-subhead font-700 text-white">
                  {group.heading}
                </h3>
                <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-label font-600 text-white backdrop-blur">
                  {group.items.length}
                </span>
              </div>
            </div>
            <ul className="grid grid-cols-1 gap-1 p-4 sm:grid-cols-2">
              {group.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="group flex min-h-[44px] items-center justify-between gap-2 rounded-card px-3 py-2 text-label font-600 text-ink-950 transition-colors hover:bg-purple-100"
                  >
                    {item.label}
                    <span
                      aria-hidden="true"
                      className="text-purple-600 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      &rarr;
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
