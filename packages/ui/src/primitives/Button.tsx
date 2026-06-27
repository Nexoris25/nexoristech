/**
 * Button for the Nexoris Technologies platform.
 *
 * Renders a real button, or an anchor when an href is given, so a call to action that navigates
 * is a link and an action is a button. Every variant carries cursor-pointer (house rule) and the
 * shared focus ring from globals.css. The primary variant is solid purple-600 with white text;
 * the secondary is a calm outline; the ghost is text-only. Tap targets meet the 44px minimum.
 */
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";
import { cn } from "../utils/cn.js";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-card font-syne font-600 cursor-pointer transition-colors disabled:cursor-not-allowed disabled:opacity-60 min-h-[44px]";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-purple-600 text-white hover:bg-purple-700",
  secondary:
    "border border-purple-200 text-ink-950 bg-white hover:bg-purple-100",
  ghost: "text-purple-600 hover:bg-purple-100",
};

const sizes: Record<ButtonSize, string> = {
  md: "px-4 py-2 text-label",
  lg: "px-6 py-3 text-body",
};

interface CommonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  className?: string;
}

type ButtonAsButton = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonProps> & {
    href?: undefined;
  };

type ButtonAsLink = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof CommonProps> & {
    href: string;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

export function Button(props: ButtonProps): ReactNode {
  const { variant = "primary", size = "md", className, children } = props;
  const classes = cn(base, variants[variant], sizes[size], className);

  if (props.href !== undefined) {
    const {
      variant: _v,
      size: _s,
      className: _c,
      children: _ch,
      ...anchorProps
    } = props;
    return (
      <a className={classes} {...anchorProps}>
        {children}
      </a>
    );
  }

  const {
    variant: _v,
    size: _s,
    className: _c,
    children: _ch,
    ...buttonProps
  } = props;
  return (
    <button className={classes} {...buttonProps}>
      {children}
    </button>
  );
}
