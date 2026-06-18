import type { Config } from "tailwindcss";
import preset from "@nexoris/config/tailwind-preset";

const config: Config = {
  // The brand preset encodes the full design system (PRD 14); this app only sets content paths.
  presets: [preset as Partial<Config>],
  content: [
    "./src/**/*.{ts,tsx}",
    // The design system components carry Tailwind classes and must be scanned too.
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
};

export default config;
