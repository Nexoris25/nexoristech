/**
 * Where a shared invitation link points.
 *
 * This is now the only way into a new account: the platform does not email invitations, an admin
 * copies the link and sends it. A link that points at localhost cannot be opened by the person it is
 * sent to, and nothing about it looks wrong to the admin copying it — it is the deployment's own
 * address, spelled correctly.
 *
 * The risk is specific. Several variables in this deployment are meant to hold localhost: the Oge
 * gateway and the media origin are server-to-server and never reach a browser. So a production
 * environment assembled from the development one is quite likely to carry APP_URL=http://localhost:3102
 * along with them, and that one does reach a person. These cases pin the guard that ignores it.
 *
 * NODE_ENV is set through vi.stubEnv rather than by assignment: TypeScript types it as read-only, so
 * assigning to it fails type-check even where it works at runtime.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const headerStore = { host: "admin.nexoristech.com", proto: "https" };

vi.mock("next/headers", () => ({
  headers: () =>
    Promise.resolve({
      get: (name: string) => {
        if (name === "x-forwarded-host") return headerStore.host;
        if (name === "host") return headerStore.host;
        if (name === "x-forwarded-proto") return headerStore.proto;
        return null;
      },
    }),
}));

const { shareOrigin } = await import("./invite.js");

beforeEach(() => {
  headerStore.host = "admin.nexoristech.com";
  headerStore.proto = "https";
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("shareOrigin", () => {
  it("uses APP_URL when it is a real public origin", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("APP_URL", "https://admin.nexoristech.com");
    expect(await shareOrigin()).toBe("https://admin.nexoristech.com");
  });

  it("drops a trailing slash", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("APP_URL", "https://admin.nexoristech.com/");
    expect(await shareOrigin()).toBe("https://admin.nexoristech.com");
  });

  it.each([
    "http://localhost:3102",
    "http://127.0.0.1:3102",
    "https://localhost",
  ])("ignores a loopback APP_URL in production (%s) and uses the request host", async (value) => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("APP_URL", value);
    expect(await shareOrigin()).toBe("https://admin.nexoristech.com");
  });

  it("honours a loopback APP_URL outside production, where localhost is the truth", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("APP_URL", "http://localhost:3102");
    expect(await shareOrigin()).toBe("http://localhost:3102");
  });

  it("falls back to the request host when APP_URL is not set at all", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("APP_URL", "");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    expect(await shareOrigin()).toBe("https://admin.nexoristech.com");
  });
});
