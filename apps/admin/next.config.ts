import type { NextConfig } from "next";

// Next.js dev mode (HMR / React Fast Refresh) and its dev overlay evaluate code with eval, and dev
// also opens a websocket for HMR. A strict production CSP (no 'unsafe-eval', connect-src 'self')
// blocks both, so the client bundle never hydrates and nothing interactive works in dev. Relax
// exactly those two directives in development only; production keeps the strict policy.
const isDev = process.env.NODE_ENV !== "production";

/** Security headers for the internal dashboard (PRD Stage 10). Same-origin only; never framed. */
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self'",
  `connect-src 'self'${isDev ? " ws: http://localhost:*" : ""}`,
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
  { key: "Referrer-Policy", value: "no-referrer" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  // The design system ships as TypeScript source and is transpiled here.
  transpilePackages: ["@nexoris/ui"],
  // Keep the PDF renderer external so its bundled standard fonts resolve at runtime.
  serverExternalPackages: ["@react-pdf/renderer"],
  poweredByHeader: false,
  // The whole workspace imports with explicit ".js" specifiers that point at TypeScript sources. Next
  // 16 defaults to Turbopack, which does not apply this ".js" -> ".ts" mapping, so the dev/build
  // scripts pin the webpack compiler (`next dev/build --webpack`) and this extensionAlias resolves
  // those specifiers. (Migrating the codebase off ".js" specifiers would let us adopt Turbopack later.)
  webpack: (config) => {
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js"],
      ".jsx": [".tsx", ".jsx"],
    };
    return config;
  },
};

export default nextConfig;
