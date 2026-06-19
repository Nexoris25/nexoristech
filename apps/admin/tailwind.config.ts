import type { Config } from "tailwindcss";
import preset from "@nexoris/config/tailwind-preset";

const config: Config = {
  // The brand preset encodes the design system (PRD 14); this app only sets content paths.
  presets: [preset as Partial<Config>],
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
};

export default config;
