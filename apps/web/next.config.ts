import type { NextConfig } from "next";

/**
 * Security headers applied to every response (PRD Stage 10). The CSP keeps everything same-origin:
 * the browser only talks to /api on this origin, which proxies to the gateway server-side, so
 * connect-src stays 'self'. Inline styles are allowed for Tailwind; framing is denied.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self'",
  "connect-src 'self'",
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
    // Media is served as WebP from the VPS filesystem, no CDN (PRD 16).
    remotePatterns: [
      {
        protocol: "https",
        hostname: "nexoristech.com",
        pathname: "/media/**",
      },
    ],
  },
  eslint: {
    // Linting runs as its own workspace task; do not run it again during the build.
    ignoreDuringBuilds: true,
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
