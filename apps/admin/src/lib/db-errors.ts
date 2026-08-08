/**
 * Telling "the database is unreachable" apart from "something is wrong with this request".
 *
 * These are not the same failure and must not be handled the same way. A dropped connection is an
 * operations problem that nobody using the screen can fix, and it must never be reported as "you are
 * signed out" — that sends the person to a login form which cannot work either, and hides the real
 * cause behind a wrong one.
 */

/** Connection-level failures from node-postgres and the socket layer beneath it. */
const CONNECTION_CODES = new Set([
  "ETIMEDOUT",
  "ECONNREFUSED",
  "ECONNRESET",
  "EHOSTUNREACH",
  "ENETUNREACH",
  "ENOTFOUND",
  "EPIPE",
  "EAI_AGAIN",
  "57P01", // admin_shutdown
  "57P02", // crash_shutdown
  "57P03", // cannot_connect_now
  "53300", // too_many_connections
  "08006", // connection_failure
  "08001", // sqlclient_unable_to_establish_sqlconnection
  "08004", // sqlserver_rejected_establishment_of_sqlconnection
]);

/** True when the error means the database could not be reached or has gone away. */
export function isDatabaseUnreachable(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const code = (error as { code?: unknown }).code;
  if (typeof code === "string" && CONNECTION_CODES.has(code)) return true;
  const message = (error as { message?: unknown }).message;
  if (typeof message !== "string") return false;
  return (
    message.includes("timeout exceeded when trying to connect") ||
    message.includes("Connection terminated") ||
    message.includes("connect ETIMEDOUT") ||
    message.includes("connect ECONNREFUSED")
  );
}

/**
 * The marker put on an error crossing into a React error boundary, so the boundary can tell this
 * apart without being handed the connection string. Boundaries are client components and anything
 * passed to one can reach the browser, so the host, port and credentials stay on the server.
 */
export const DB_UNREACHABLE_MARKER = "NEXORIS_DB_UNREACHABLE";

/**
 * Rethrow a database failure in the form the error boundary understands, logging the real cause
 * server-side. Any other error passes through untouched.
 */
export function rethrowAsUserFacing(error: unknown, what: string): never {
  if (isDatabaseUnreachable(error)) {
    console.error(`[db] unreachable while ${what}:`, error instanceof Error ? error.message : error);
    throw new Error(DB_UNREACHABLE_MARKER);
  }
  throw error;
}
