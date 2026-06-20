/**
 * Form primitives for the Nexoris Technologies platform.
 *
 * One standard control size everywhere: 48px tall, 12px radius, hairline purple border, the
 * shared focus ring from globals.css. No control is ever user-resizable (the textarea is locked),
 * so forms keep a single, calm rhythm across the marketing site, the CMS, and the admin
 * dashboard. Field wraps a control with its label, optional hint, and error in the correct order
 * for screen readers.
 */
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "../utils/cn.js";

const controlBase =
  "w-full rounded-card border border-purple-200 bg-white px-4 text-body text-ink-950 placeholder:text-neutral-600/70 transition-colors hover:border-purple-500/40 focus:border-purple-500 disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:opacity-70";

/** The fixed standard height for single-line controls (48px). */
const controlHeight = "h-12";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...rest }: InputProps): ReactNode {
  return <input className={cn(controlBase, controlHeight, className)} {...rest} />;
}

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, rows = 5, ...rest }: TextareaProps): ReactNode {
  // resize-none is deliberate: no control on this platform is user-resizable.
  return (
    <textarea
      rows={rows}
      className={cn(controlBase, "resize-none py-3 leading-relaxed", className)}
      {...rest}
    />
  );
}

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className, children, ...rest }: SelectProps): ReactNode {
  return (
    <div className="relative">
      <select
        className={cn(
          controlBase,
          controlHeight,
          "cursor-pointer appearance-none pr-10",
          className,
        )}
        {...rest}
      >
        {children}
      </select>
      <svg
        aria-hidden="true"
        width="12"
        height="12"
        viewBox="0 0 12 12"
        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-neutral-600"
      >
        <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

export interface FieldProps {
  /** The control's accessible label. */
  label: string;
  /** The id wired to the control via htmlFor; pass the same id to the control. */
  htmlFor: string;
  /** Optional helper text shown under the label. */
  hint?: string;
  /** Optional error message; sets the field into an error state. */
  error?: string;
  children: ReactNode;
  className?: string;
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
}: FieldProps): ReactNode {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-label font-600 text-ink-950">
        {label}
      </label>
      {hint ? <span className="text-label text-neutral-600">{hint}</span> : null}
      {children}
      {error ? (
        <span className="text-label font-600 text-purple-700" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}
