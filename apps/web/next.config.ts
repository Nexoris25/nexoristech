import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
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
