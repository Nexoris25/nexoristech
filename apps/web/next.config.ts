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
/**
 * Where CMS media is served from, as a CSP source.
 *
 * Uploads live on the admin origin, so every article cover, author headshot and in-body picture is
 * loaded cross-origin. `img-src https:` covered that in production by accident - any https host at
 * all - and blocked it outright in development, where the admin runs on http://localhost:3001. The
 * result was every CMS image on the site rendering as a broken icon with its alt text showing, with
 * nothing in the server log to say why, because a CSP refusal happens in the browser.
 *
 * Naming the configured origin fixes development and narrows production at the same time: the site
 * is no longer declaring that any image from anywhere on the web may be loaded into its pages.
 */
const mediaOrigin = ((): string => {
  const base = process.env.CMS_MEDIA_BASE?.trim();
  if (!base) return "";
  try {
    return new URL(base).origin;
  } catch {
    return "";
  }
})();

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
  `img-src 'self' data: https:${mediaOrigin ? ` ${mediaOrigin}` : ""}`,
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
