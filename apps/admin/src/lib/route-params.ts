/**
 * Guards for the values that arrive in a URL.
 *
 * Every record in this platform is keyed by a UUID, and every detail page reads one out of the path
 * and puts it straight into a query. A path segment that is not a UUID — a mistyped link, a stale
 * bookmark, `/crm/pipeline` typed by someone guessing at a route, a crawler walking a URL that never
 * existed — reached Postgres as a cast, which it refuses: `invalid input syntax for type uuid`. The
 * page then returned a 500 and an error screen saying something had gone wrong on our side.
 *
 * Nothing had. The record simply is not there, and the answer to that is 404. The pages already said
 * so for an id that was well formed but missing; the guard here says it for one that was never an id
 * at all, before the database is asked about it.
 */
import { notFound } from "next/navigation";

/** Canonical UUID: eight-four-four-four-twelve hex digits, any version. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The id from a route, or a 404.
 *
 * `notFound()` throws, so anything after a call to this has a real UUID in hand and the return value
 * can be used directly.
 */
export function requireUuid(value: string): string {
  if (!UUID.test(value)) notFound();
  return value;
}

/** Whether a value could name a row, for callers that need to branch rather than stop. */
export function isUuid(value: string): boolean {
  return UUID.test(value);
}
