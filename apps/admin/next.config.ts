import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The design system ships as TypeScript source and is transpiled here.
  transpilePackages: ["@nexoris/ui"],
  poweredByHeader: false,
  eslint: {
    // Linting runs as its own workspace task; do not run it again during the build.
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    // Workspace packages use explicit .js import specifiers that point at TypeScript sources.
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js"],
      ".jsx": [".tsx", ".jsx"],
    };
    return config;
  },
};

export default nextConfig;
