/**
 * Shared UI tokens for the CRM, so a lead's rating and an alert's priority look the same on every
 * screen. Lead ratings use a temperature scale (Hot warm-red, Warm amber, Cold cool-blue) as
 * functional status colours, the same way the dashboard already colours priorities; the brand
 * purple stays reserved for primary actions and navigation. Class strings are written out in full
 * so Tailwind's scanner keeps them.
 */

export interface RatingStyle {
  label: string;
  /** Soft chip: tinted background with dark text. */
  chip: string;
  /** Solid pill: filled background with white text. */
  solid: string;
  /** A dot / accent hex for inline marks and sparklines. */
  dot: string;
  /** Left-border accent utility. */
  border: string;
}

const RATINGS: Record<string, RatingStyle> = {
  Hot: {
    label: "Hot",
    chip: "bg-[#FDECEA] text-[#C0362C]",
    solid: "bg-[#E1483C] text-white",
    dot: "#E1483C",
    border: "border-l-[#E1483C]",
  },
  Warm: {
    label: "Warm",
    chip: "bg-[#FBF1DF] text-[#9A6A00]",
    solid: "bg-[#C67C1B] text-white",
    dot: "#C67C1B",
    border: "border-l-[#C67C1B]",
  },
  Cold: {
    label: "Cold",
    chip: "bg-[#EAEEF9] text-[#3B5488]",
    solid: "bg-[#4B6BB3] text-white",
    dot: "#4B6BB3",
    border: "border-l-[#4B6BB3]",
  },
};

const UNSCORED: RatingStyle = {
  label: "Unscored",
  chip: "bg-neutral-100 text-neutral-600",
  solid: "bg-neutral-400 text-white",
  dot: "#9CA3AF",
  border: "border-l-neutral-300",
};

export function rating(band: string | null | undefined): RatingStyle {
  return (band && RATINGS[band]) || UNSCORED;
}

export type Priority = "High" | "Medium" | "Low";

export const PRIORITY_STYLE: Record<Priority, { chip: string; dot: string }> = {
  High: { chip: "bg-[#FDECEA] text-[#C0362C]", dot: "#E1483C" },
  Medium: { chip: "bg-[#FBF1DF] text-[#9A6A00]", dot: "#C67C1B" },
  Low: { chip: "bg-[#E4F5EE] text-[#0E7A5B]", dot: "#12A97A" },
};

export const SOURCE_LABEL: Record<string, string> = {
  "contact-form": "Contact form",
  "oge-chat": "Oge chat",
  "solution-finder": "Solution Finder",
  whatsapp: "WhatsApp",
  email: "Email",
  referral: "Referral",
};
