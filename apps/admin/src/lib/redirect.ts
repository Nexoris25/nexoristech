/**
 * Redirects that survive a reverse proxy.
 *
 * Every form in this platform posts to a route handler which answers with a 303 back to a page, and
 * every one of them built the destination with `new URL(path, request.url)`. Behind a proxy that is
 * wrong, and wrong in a way that only appears once the app is deployed: `request.url` is the address
 * the *proxy* connected to — `http://127.0.0.1:3102/...` — not the address the browser asked for. So
 * the browser is handed `Location: https://127.0.0.1:3102/dashboard`, an address only the server
 * itself can reach, and the navigation goes nowhere.
 *
 * Reproduced exactly: posting to the sign-in route with `Host: app.nexoristech.com` and
 * `X-Forwarded-Proto: https` answered `location: https://localhost:4600/login?error=1`. From a phone
 * that is a dead link, so pressing Sign in appears to do nothing at all while the server records a
 * perfectly ordinary 303.
 *
 * The fix is to send a relative Location. RFC 7231 §7.1.2 allows it and every browser resolves it
 * against the URL it actually requested, so the scheme and host are the browser's own and cannot be
 * mangled by whatever sits in front. It also means the app never has to be told its public address.
 */
import { NextResponse } from "next/server";

/**
 * A 303 to a path on this site.
 *
 * 303 rather than 302 on purpose: it tells the browser to follow with GET, which is what turns a
 * form POST into a normal page load and stops a refresh from re-submitting.
 */
export function seeOther(path: string): NextResponse {
  return new NextResponse(null, {
    status: 303,
    // Guarded so a caller cannot accidentally send the browser off-site through this helper.
    headers: { location: path.startsWith("/") ? path : `/${path}` },
  });
}

/**
 * A path being assembled, for the handlers that set several query parameters across branches.
 *
 * Those read much better with `searchParams.set(...)` than with string concatenation, and that needs
 * a URL, and a URL needs an origin. The origin here is a placeholder that never leaves this module:
 * `seeOtherAt` sends only the path and query, so nothing about it can reach a browser. It is
 * deliberately not the request's own origin, because that is the value this file exists to stop
 * relying on.
 */
const PLACEHOLDER_ORIGIN = "http://redirect.invalid";

export function pathBuilder(path: string): URL {
  return new URL(path, PLACEHOLDER_ORIGIN);
}

/** A 303 to a path built with `pathBuilder`, keeping its query and discarding the placeholder. */
export function seeOtherAt(url: URL): NextResponse {
  return seeOther(`${url.pathname}${url.search}`);
}
