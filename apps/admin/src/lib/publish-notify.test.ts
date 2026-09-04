/**
 * Publishing has to actually refresh the website.
 *
 * The revalidation POST went to /api/revalidate with no trailing slash. The website appends one to
 * every URL, so the request was answered with a 308 — and a redirect turns a POST into a GET and
 * drops its body. fetch followed it, the endpoint answered 200, and `res.ok` reported a success that
 * had revalidated nothing. So publishing an article never refreshed the Insights hub, the home page
 * or the author's profile: each waited out its own five-minute timer, and an editor who published and
 * then looked at the site saw the new piece missing with nothing to explain it.
 *
 * Two things are pinned here: the URL, and that a response which did not name the paths it acted on
 * counts as a failure rather than a success.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
/*
 * Loaded once here, for its cost rather than its exports.
 *
 * Each test re-imports this module after `vi.resetModules()`, because it reads WEB_ORIGIN at import
 * time and every test needs its own view of the environment. The first of those imports pulled in
 * the database client and everything under it, which took two seconds on its own and, inside the
 * full parallel run, tripped vitest's five-second limit — failing a test with nothing wrong in it.
 * Importing here pays the transform and load at collection, so the re-imports are cheap.
 */
import "./publish-notify.js";

const ORIGINAL_FETCH = globalThis.fetch;

async function notify(): Promise<{ revalidated: boolean }> {
  const { notifyPublished } = await import("./publish-notify.js");
  return notifyPublished({ path: "/insights/a-piece", kind: "insight", published: true });
}

describe("revalidation on publish", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env["REVALIDATION_SECRET"] = "test-secret";
    process.env["WEB_ORIGIN"] = "https://nexoristech.com";
    delete process.env["INDEXNOW_KEY"];
  });

  afterEach(() => {
    globalThis.fetch = ORIGINAL_FETCH;
  });

  it("posts to the URL the site serves, with the trailing slash", async () => {
    const calls: string[] = [];
    globalThis.fetch = vi.fn(async (url: string | URL | Request) => {
      calls.push(String(url));
      return new Response(JSON.stringify({ revalidated: ["/insights"] }), { status: 200 });
    }) as unknown as typeof fetch;

    await notify();
    expect(calls[0]).toBe("https://nexoristech.com/api/revalidate/");
  });

  it("does not follow a redirect, because one means the URL is wrong", async () => {
    let init: RequestInit | undefined;
    globalThis.fetch = vi.fn(async (_url: string | URL | Request, options?: RequestInit) => {
      init = options;
      return new Response(JSON.stringify({ revalidated: ["/insights"] }), { status: 200 });
    }) as unknown as typeof fetch;

    await notify();
    expect(init?.redirect).toBe("manual");
  });

  it("counts a 308 as a failure rather than a success", async () => {
    globalThis.fetch = vi.fn(async () => new Response(null, { status: 308 })) as unknown as typeof fetch;
    expect((await notify()).revalidated).toBe(false);
  });

  it("counts a 200 that revalidated nothing as a failure", async () => {
    // Exactly what the redirect produced: a perfectly good response that did no work.
    globalThis.fetch = vi.fn(
      async () => new Response(JSON.stringify({ revalidated: [] }), { status: 200 }),
    ) as unknown as typeof fetch;
    expect((await notify()).revalidated).toBe(false);
  });

  it("reports success when the site names the paths it rebuilt", async () => {
    globalThis.fetch = vi.fn(
      async () => new Response(JSON.stringify({ revalidated: ["/insights/a-piece", "/insights", "/"] }), { status: 200 }),
    ) as unknown as typeof fetch;
    expect((await notify()).revalidated).toBe(true);
  });

  it("asks for the home page as well as the hub, because it lists the latest articles", async () => {
    let sent: string[] = [];
    globalThis.fetch = vi.fn(async (_url: string | URL | Request, options?: RequestInit) => {
      sent = (JSON.parse(String(options?.body ?? "{}")) as { paths?: string[] }).paths ?? [];
      return new Response(JSON.stringify({ revalidated: sent }), { status: 200 });
    }) as unknown as typeof fetch;

    await notify();
    expect(sent).toContain("/insights/a-piece");
    expect(sent).toContain("/insights");
    expect(sent).toContain("/");
    expect(sent).toContain("/sitemap.xml");
    expect(sent).toContain("/llms.txt");
  });

  it("includes the author profile pages it was given, and lists each path once", async () => {
    let sent: string[] = [];
    globalThis.fetch = vi.fn(async (_url: string | URL | Request, options?: RequestInit) => {
      sent = (JSON.parse(String(options?.body ?? "{}")) as { paths?: string[] }).paths ?? [];
      return new Response(JSON.stringify({ revalidated: sent }), { status: 200 });
    }) as unknown as typeof fetch;

    const { notifyPublished } = await import("./publish-notify.js");
    await notifyPublished({
      path: "/insights/a-piece",
      kind: "insight",
      published: true,
      // The same person as author and fact-checker, which is ordinary and must not queue the page twice.
      extraPaths: ["/chinedu-nwogu", "/chinedu-nwogu"],
    });

    expect(sent).toContain("/chinedu-nwogu");
    expect(sent.length).toBe(new Set(sent).size);
  });
});
