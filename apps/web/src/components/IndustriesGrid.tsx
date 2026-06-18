"use client";
/**
 * The home page filterable industries grid (PRD 12, Home industries section). Renders the 20
 * industry pages as tiles, filterable by the four catalogue groups, and is the anchor target for
 * the footer "See all 20 industries" link. The tiles link to the real hardcoded industry pages,
 * so nothing here is fabricated.
 */
import { useId, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@nexoris/ui";
import { industryGroups } from "../content/catalogue.js";

const ALL = "All";
const filters = [ALL, ...industryGroups.map((group) => group.heading)];

interface Tile {
  label: string;
  href: string;
  group: string;
}

const tiles: Tile[] = industryGroups.flatMap((group) =>
  group.items.map((item) => ({
    label: item.label,
    href: item.href,
    group: group.heading,
  })),
);

export function IndustriesGrid(): ReactNode {
  const [active, setActive] = useState<string>(ALL);
  const headingId = useId();
  const shown =
    active === ALL ? tiles : tiles.filter((tile) => tile.group === active);

  return (
    <div className="mt-8">
      <div
        role="group"
        aria-label="Filter industries"
        className="flex flex-wrap gap-2"
      >
        {filters.map((filter) => {
          const isActive = filter === active;
          return (
            <button
              key={filter}
              type="button"
              aria-pressed={isActive}
              onClick={() => setActive(filter)}
              className={cn(
                "min-h-[44px] cursor-pointer rounded-card px-4 py-2 text-label font-600 transition-colors",
                isActive
                  ? "bg-purple-600 text-white"
                  : "border border-purple-200 bg-white text-ink-950 hover:bg-purple-100",
              )}
            >
              {filter}
            </button>
          );
        })}
      </div>
      <p id={headingId} className="sr-only" aria-live="polite">
        {shown.length} industries shown
      </p>
      <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {shown.map((tile) => (
          <li key={tile.href}>
            <Link
              href={tile.href}
              className="flex min-h-[72px] items-center rounded-card border border-purple-200 bg-white p-4 text-label font-600 text-ink-950 shadow-subtle transition-colors hover:bg-purple-100"
            >
              {tile.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
