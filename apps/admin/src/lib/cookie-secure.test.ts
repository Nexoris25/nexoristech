/**
 * Whether the session cookie is marked Secure.
 *
 * This decides whether anyone can sign in at all, which is why it is worth pinning. A Secure cookie
 * is discarded by the browser on a plain HTTP connection, and discarded silently: the sign-in
 * succeeds, the cookie is set, the browser drops it, the redirect to /dashboard arrives with no
 * session, and the admin lands back on /login with no error. Every credential is correct and the
 * server log shows a successful sign-in. That is exactly what a deployment reached over http://host:3102
 * did while this was keyed to NODE_ENV.
 *
 * The rule: Secure when the browser's connection is HTTPS, not when the build says production. The
 * proxy header is authoritative, because Next normally sits behind something that terminates TLS and
 * therefore sees plain HTTP itself.
 */
import { describe, it, expect } from "vitest";
import { cookieSecure } from "./session.js";

const h = (init: Record<string, string> = {}): Headers => new Headers(init);

describe("cookieSecure", () => {
  it("is Secure when the proxy reports an https connection", () => {
    expect(cookieSecure(h({ "x-forwarded-proto": "https" }))).toBe(true);
  });

  it("is not Secure when the proxy reports http, even in a production build", () => {
    expect(cookieSecure(h({ "x-forwarded-proto": "http" }))).toBe(false);
  });

  it("reads only the first hop of a chained x-forwarded-proto", () => {
    expect(cookieSecure(h({ "x-forwarded-proto": "https, http" }))).toBe(true);
    expect(cookieSecure(h({ "x-forwarded-proto": "http, https" }))).toBe(false);
  });

  it("tolerates casing and padding from whatever proxy is in front", () => {
    expect(cookieSecure(h({ "x-forwarded-proto": "  HTTPS " }))).toBe(true);
  });

  /*
   * With no proxy header the request URL is the only evidence. This is the direct-to-port case —
   * http://194.147.95.7:3102 — where marking the cookie Secure is what locked the administrator out.
   */
  it("falls back to the request protocol when no proxy header is present", () => {
    expect(cookieSecure(h(), new URL("https://admin.nexoristech.com/api/auth/login"))).toBe(true);
    expect(cookieSecure(h(), new URL("http://194.147.95.7:3102/api/auth/login"))).toBe(false);
  });

  it("is not Secure when there is neither a header nor a URL to judge by", () => {
    expect(cookieSecure(h())).toBe(false);
  });
});
