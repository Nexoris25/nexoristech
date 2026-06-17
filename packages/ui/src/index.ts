/**
 * @nexoris/ui
 *
 * The Nexoris Technologies design system. Built in Stage 2, before any page, so every page is
 * born accessible and on-brand. Components consume the Tailwind brand preset from
 * @nexoris/config and follow the accessibility rules in PRD Section 15.
 */

export const UI_PACKAGE = "@nexoris/ui" as const;

export { cn } from "./utils/cn.js";
export { Button } from "./primitives/Button.js";
export type {
  ButtonProps,
  ButtonVariant,
  ButtonSize,
} from "./primitives/Button.js";
export { Container, Section } from "./primitives/layout.js";
export type { ContainerProps, SectionProps } from "./primitives/layout.js";
export { SkipLink, VisuallyHidden } from "./primitives/a11y.js";
export type { SkipLinkProps, VisuallyHiddenProps } from "./primitives/a11y.js";
export { DataState, EmptyState, ErrorState, Skeleton } from "./data/states.js";
export type {
  DataStatus,
  DataStateProps,
  EmptyStateProps,
  ErrorStateProps,
} from "./data/states.js";
export { ResponsiveTable } from "./data/Table.js";
export type {
  ResponsiveTableProps,
  TableColumn,
  TablePattern,
} from "./data/Table.js";
