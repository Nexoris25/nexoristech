/**
 * The time window a dashboard is showing, and the one before it.
 *
 * Three dashboards each hardcoded their own window — the calendar month, the calendar year, today —
 * with a period picker above them whose options did nothing. Making those pickers real means one
 * definition of what a period is, because the comparison figures depend on it: "New Leads +12%" is
 * this window against the window of equal length immediately before it, and if those two disagree the
 * percentage is meaningless.
 *
 * Bounds are half-open, `[start, end)`. That is what makes the current and previous windows tile
 * exactly with no double-counted row on the boundary, which a `BETWEEN` comparison would produce.
 *
 * Everything is computed in Lagos time. The company operates there, and a "today" that rolls over at
 * midnight UTC is an hour early — figures would move at 11pm local.
 */

/** Ranges a dashboard may be viewed over. */
export const PERIODS = [
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "mtd", label: "This month" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "ytd", label: "Year to date" },
  { value: "12m", label: "Last 12 months" },
] as const;

export type PeriodValue = (typeof PERIODS)[number]["value"];

export interface PeriodWindow {
  value: PeriodValue;
  label: string;
  /** Inclusive start of the window. */
  start: Date;
  /** Exclusive end — always "now", so a part-finished period reads as far as it has got. */
  end: Date;
  /** Inclusive start of the preceding window of equal length. */
  previousStart: Date;
  /** Exclusive end of the preceding window; equals `start`, so the two tile exactly. */
  previousEnd: Date;
}

const LAGOS_OFFSET_MS = 60 * 60 * 1000; // West Africa Time, UTC+1, no daylight saving.

/** Midnight in Lagos on the day `at` falls on, as a UTC instant. */
function lagosStartOfDay(at: Date): Date {
  const local = new Date(at.getTime() + LAGOS_OFFSET_MS);
  local.setUTCHours(0, 0, 0, 0);
  return new Date(local.getTime() - LAGOS_OFFSET_MS);
}

/** Midnight in Lagos on the first of the month `at` falls in. */
function lagosStartOfMonth(at: Date): Date {
  const local = new Date(at.getTime() + LAGOS_OFFSET_MS);
  local.setUTCDate(1);
  local.setUTCHours(0, 0, 0, 0);
  return new Date(local.getTime() - LAGOS_OFFSET_MS);
}

/** Midnight in Lagos on 1 January of the year `at` falls in. */
function lagosStartOfYear(at: Date): Date {
  const local = new Date(at.getTime() + LAGOS_OFFSET_MS);
  local.setUTCMonth(0, 1);
  local.setUTCHours(0, 0, 0, 0);
  return new Date(local.getTime() - LAGOS_OFFSET_MS);
}

/** Shift a date by whole months, keeping the day of month where the target month allows. */
function addMonths(at: Date, months: number): Date {
  const local = new Date(at.getTime() + LAGOS_OFFSET_MS);
  local.setUTCMonth(local.getUTCMonth() + months);
  return new Date(local.getTime() - LAGOS_OFFSET_MS);
}

/**
 * Resolve a `?range=` value into the window to query and the one to compare against.
 *
 * An unrecognised or absent value falls back to `fallback` rather than throwing: this comes straight
 * from the URL and a mistyped parameter should show a sensible dashboard, not an error.
 */
export function resolvePeriod(raw: string | undefined, fallback: PeriodValue = "mtd", now = new Date()): PeriodWindow {
  const match = PERIODS.find((p) => p.value === raw);
  const value = (match?.value ?? fallback) as PeriodValue;
  const label = (match ?? PERIODS.find((p) => p.value === value))?.label ?? "This month";

  let start: Date;
  let previousStart: Date;

  switch (value) {
    case "today":
      start = lagosStartOfDay(now);
      previousStart = new Date(start.getTime() - 86_400_000);
      break;
    case "7d":
      start = new Date(lagosStartOfDay(now).getTime() - 6 * 86_400_000);
      previousStart = new Date(start.getTime() - 7 * 86_400_000);
      break;
    case "30d":
      start = new Date(lagosStartOfDay(now).getTime() - 29 * 86_400_000);
      previousStart = new Date(start.getTime() - 30 * 86_400_000);
      break;
    case "90d":
      start = new Date(lagosStartOfDay(now).getTime() - 89 * 86_400_000);
      previousStart = new Date(start.getTime() - 90 * 86_400_000);
      break;
    case "ytd":
      start = lagosStartOfYear(now);
      // The same span a year earlier, so a part-finished year compares against a part-finished year
      // rather than against a whole one.
      previousStart = addMonths(start, -12);
      break;
    case "12m":
      start = addMonths(lagosStartOfDay(now), -12);
      previousStart = addMonths(start, -12);
      break;
    case "mtd":
    default:
      start = lagosStartOfMonth(now);
      previousStart = addMonths(start, -1);
      break;
  }

  return { value, label, start, end: now, previousStart, previousEnd: start };
}
