/**
 * Mega-menu presentation for the Nexoris Technologies header flyouts (PRD 7.2 to 7.4).
 *
 * MegaMenu lays the panel out in columns (two for Services, four for Industries). MegaMenuItem
 * renders one entry with its label and the short plain-language line that lets a first-time visitor
 * understand it without clicking. The item is polymorphic through `as`, so apps/web passes its
 * own link component (for client navigation) while the design system owns the styling.
 */
import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { cn } from "../utils/cn.js";

export interface MegaMenuProps {
  /** Number of columns at the medium breakpoint and up. */
  columns: 1 | 2 | 4;
  children: ReactNode;
  className?: string;
}

const columnClass: Record<MegaMenuProps["columns"], string> = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  4: "md:grid-cols-4",
};

export function MegaMenu({
  columns,
  children,
  className,
}: MegaMenuProps): ReactNode {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-x-8 gap-y-1",
        columnClass[columns],
        className,
      )}
    >
      {children}
    </div>
  );
}

export type MegaMenuItemProps<T extends ElementType> = {
  /** The element or component to render, defaulting to an anchor. */
  as?: T;
  /** The item label, matching the target page H1 closely for anchor-text consistency. */
  label: string;
  /** A short plain-language line describing the item. */
  description?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "label">;

export function MegaMenuItem<T extends ElementType = "a">({
  as,
  label,
  description,
  className,
  ...rest
}: MegaMenuItemProps<T>): ReactNode {
  const Component = (as ?? "a") as ElementType;
  return (
    <Component
      className={cn(
        "block cursor-pointer rounded-card px-3 py-2 hover:bg-purple-100",
        className,
      )}
      {...rest}
    >
      <span className="block text-label font-600 text-ink-950">{label}</span>
      {description ? (
        <span className="mt-0.5 block text-label text-neutral-600">
          {description}
        </span>
      ) : null}
    </Component>
  );
}
