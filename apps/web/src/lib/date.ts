/**
 * Date formatting in the Africa/Lagos timezone (PRD 9: NG locale). Used for Insights and any
 * published-date display so dates read consistently regardless of where the server runs.
 */
export function formatLagosDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-NG", {
    timeZone: "Africa/Lagos",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

/**
 * Resolve CMS date tokens at render in Africa/Lagos (PRD Stage 7): [year], [month], and
 * [month-year]. Lets editors write evergreen copy like "Best CRM in [year]" that stays current
 * without re-editing. Case-insensitive; resolved on each server render (ISR).
 */
export function resolveDateTokens(text: string, now: Date = new Date()): string {
  const fmt = (options: Intl.DateTimeFormatOptions): string =>
    new Intl.DateTimeFormat("en-NG", { timeZone: "Africa/Lagos", ...options }).format(
      now,
    );
  const year = fmt({ year: "numeric" });
  const month = fmt({ month: "long" });
  return text
    .replace(/\[month-year\]/gi, `${month} ${year}`)
    .replace(/\[year\]/gi, year)
    .replace(/\[month\]/gi, month);
}
