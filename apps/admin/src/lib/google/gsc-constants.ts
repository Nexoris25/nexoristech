/**
 * Shared Search Console presentation constants, so the CMS dashboard, the Search Console screen, and AI
 * Visibility all offer the same date ranges and colour the same metric the same way. The colours are
 * Google Search Console's own metric colours, so a chart here reads exactly like the one in GSC.
 */

/**
 * The selectable date ranges, matching the CMS dashboard overview.
 *
 * The 24-hour window is the freshest view Search Console offers, not a complete one: Google finalises a
 * day's figures over the following two to three days, so the most recent day is always still settling.
 * It answers "is anything happening right now", which is what it is there for.
 */
export const GSC_RANGES = [
  { value: "24h", label: "Last 24 hours", days: 1 },
  { value: "7d", label: "Last 7 days", days: 7 },
  { value: "28d", label: "Last 28 days", days: 28 },
  { value: "60d", label: "Last 60 days", days: 60 },
  { value: "90d", label: "Last 90 days", days: 90 },
  { value: "6m", label: "Last 6 months", days: 180 },
  { value: "12m", label: "Last 12 months", days: 365 },
] as const;

export type GscRangeValue = (typeof GSC_RANGES)[number]["value"];

/**
 * The window a screen opens on when none is asked for.
 *
 * Named rather than "the first entry", because adding the 24-hour option to the front of the list would
 * otherwise have made it the default everywhere — and a day of unsettled figures is a poor first
 * impression of a dashboard.
 */
export const DEFAULT_GSC_RANGE: GscRangeValue = "7d";

/** Resolve a `?range=` value to its definition, falling back to the default window. */
export function resolveRange(value: string | undefined): (typeof GSC_RANGES)[number] {
  return GSC_RANGES.find((r) => r.value === value)
    ?? GSC_RANGES.find((r) => r.value === DEFAULT_GSC_RANGE)
    ?? GSC_RANGES[0];
}

/** Google Search Console's metric colours: clicks blue, impressions purple, CTR teal, position orange. */
export const GSC_COLORS = {
  clicks: "#4285F4",
  impressions: "#5E35B1",
  ctr: "#00897B",
  position: "#E8710A",
} as const;

/** The four Search Console metrics, in the order Google shows them. */
export const GSC_METRICS = [
  { key: "clicks", label: "Total Clicks", color: GSC_COLORS.clicks },
  { key: "impressions", label: "Total Impressions", color: GSC_COLORS.impressions },
  { key: "ctr", label: "Average CTR", color: GSC_COLORS.ctr },
  { key: "position", label: "Average Position", color: GSC_COLORS.position },
] as const;
