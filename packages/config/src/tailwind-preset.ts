/**
 * Tailwind brand preset for the Nexoris Technologies platform.
 *
 * Consumed by every surface (apps/web, apps/admin, and any CMS custom panels) so the
 * design system tokens never drift. Encodes the Product Requirements Document, Part One,
 * Section 14.
 */
import type { Config } from "tailwindcss";
import {
  colors,
  spacing,
  radius,
  shadows,
  fontFamilies,
  fontSize,
  measure,
  breakpoints,
} from "./tokens.js";

const preset: Partial<Config> = {
  theme: {
    // Replace Tailwind's default breakpoints with the brand scale (base styles target 280px).
    screens: { ...breakpoints },
    extend: {
      colors: {
        purple: colors.purple,
        ink: colors.ink,
        neutral: colors.neutral,
        mint: colors.mint,
        white: colors.white,
      },
      spacing: { ...spacing },
      borderRadius: {
        card: radius.card,
      },
      boxShadow: {
        subtle: shadows.subtle,
        medium: shadows.medium,
        prominent: shadows.prominent,
      },
      fontFamily: {
        roboto: [...fontFamilies.roboto],
        jakarta: [...fontFamilies.jakarta],
        inter: [...fontFamilies.inter],
        lora: [...fontFamilies.lora],
        mono: [...fontFamilies.mono],
      },
      // The fluid clamp-based type scale (PRD 14.2). Each entry is a [size, config] tuple in
      // the shape Tailwind expects for fontSize.
      fontSize,
      maxWidth: {
        article: measure.article,
      },
    },
  },
};

export default preset;
