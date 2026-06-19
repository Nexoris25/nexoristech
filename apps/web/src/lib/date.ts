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
