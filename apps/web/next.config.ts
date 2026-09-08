import type { NextConfig } from "next";

/**
 * Security headers applied to every response (PRD Stage 10). The CSP keeps everything same-origin:
 * the browser only talks to /api on this origin, which proxies to the gateway server-side, so
 * connect-src stays 'self'. Inline styles are allowed for Tailwind; framing is denied.
 */
const isDev = process.env.NODE_ENV !== "production";

/**
 * The development server evaluates modules with eval and talks to a websocket for hot reload, so a CSP
 * without 'unsafe-eval' silently stops React from hydrating: the HTML renders but nothing on the page is
 * interactive. Those two allowances are therefore development-only; production keeps the strict policy.
 */
/*
 * CMS media needs no CSP source of its own any more.
 *
 * Uploads used to be loaded cross-origin from the admin, so the policy had to name that origin. They
 * are now fetched by this server and served from this origin, so `'self'` already covers them, and
 * naming a build-time origin here would be one more value frozen into the deployment for no reason.
 * `https:` remains for the Unsplash photography.
 */

/**
 * Google Analytics, allowed only when it is actually configured.
 *
 * The site has carried a consent-gated GA4 component from the start, and the CSP has never named
 * googletagmanager.com — so the moment a visitor accepted analytics, the browser blocked the script
 * and GA4 recorded nothing. It failed in the console, where nothing on the server would ever show
 * it, and it failed identically in production. Every visit since launch went uncounted.
 *
 * Gated on the measurement id so a deployment with analytics switched off keeps the tighter policy
 * rather than advertising hosts it never talks to. The endpoints are the script host, and the
 * collection hosts gtag beacons to.
 */
const analyticsOn = Boolean(process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID?.trim());
const GA_SCRIPT = "https://www.googletagmanager.com";
const GA_CONNECT =
  "https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com";

const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}${analyticsOn ? ` ${GA_SCRIPT}` : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self'",
  `connect-src 'self'${isDev ? " ws: wss:" : ""}${analyticsOn ? ` ${GA_CONNECT}` : ""}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: CSP },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  /*
   * There is deliberately no rewrite for /uploads here.
   *
   * It was one, and it could not work on a server. Next resolves rewrites at build time and writes
   * the finished destination into routes-manifest.json, so whatever CMS_MEDIA_BASE happened to hold
   * on the machine that ran `next build` is frozen into the deployment — a laptop's build shipped
   * `http://localhost:3102`, and a build made before the variable was set shipped no rewrite at all.
   * Every image 404s, and setting the variable on the server afterwards changes nothing.
   *
   * app/uploads/[...path]/route.ts does the same proxying and reads the environment per request, so
   * the address is a matter of configuration rather than of when the build happened.
   */
  // The server appends a trailing slash to every URL, for example /about-us/ (decision D-002).
  trailingSlash: true,
  // The design system and SEO engine ship as TypeScript source and are transpiled here.
  transpilePackages: ["@nexoris/ui", "@nexoris/seo"],
  poweredByHeader: false,
  images: {
    // Media is served as WebP from the VPS filesystem, no CDN (PRD 16). Marketing
    // photography is sourced from Unsplash (free commercial licence) and optimised on demand.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "nexoristech.com",
        pathname: "/media/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
  webpack: (config) => {
    // The workspace packages and content modules use explicit .js import specifiers that point
    // at TypeScript sources (NodeNext style). Teach webpack to resolve .js to .ts and .tsx.
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js"],
      ".jsx": [".tsx", ".jsx"],
    };
    return config;
  },
};

export default nextConfig;
