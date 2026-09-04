"use client";
/**
 * Password field used across the authentication screens (Batch 1): a rounded input with a trailing
 * show/hide eye toggle, and an optional live strength meter (four segments plus a label) that
 * matches the design. Uncontrolled so it works inside a native form post.
 */
import type { ReactNode } from "react";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

function strength(value: string): { score: number; label: string; color: string } {
  let s = 0;
  if (value.length >= 8) s += 1;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) s += 1;
  if (/\d/.test(value)) s += 1;
  if (/[^A-Za-z0-9]/.test(value)) s += 1;
  const labels = ["Too short", "Weak", "Fair", "Good", "Strong"];
  const colors = ["#E2E8F0", "#EF4444", "#F59E0B", "#3B82F6", "#22C55E"];
  return { score: s, label: value ? labels[s]! : "", color: colors[s]! };
}

/*
 * There is deliberately no way to seed this field.
 *
 * It used to take a `defaultValue`, and the sign-in page passed a working administrator password
 * into it, which then appeared in the served HTML. No caller needs the prop — a password field
 * should always start empty — so it is gone rather than left as a loaded gun for the next edit.
 */
export function PasswordInput({
  name,
  placeholder = "••••••••••",
  autoComplete = "current-password",
  showStrength = false,
}: {
  name: string;
  placeholder?: string;
  autoComplete?: string;
  showStrength?: boolean;
}): ReactNode {
  const [show, setShow] = useState(false);
  const [value, setValue] = useState("");
  const st = strength(value);

  return (
    <div>
      <div className="relative">
        <input
          name={name}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          required
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 pr-10 text-[0.9rem] text-slate-900 placeholder:text-slate-500 focus:border-[#543CDA] focus:outline-none focus:ring-2 focus:ring-[#543CDA]/15"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer p-1 text-slate-500 hover:text-slate-600"
        >
          {show ? <EyeOff size={17} strokeWidth={2} /> : <Eye size={17} strokeWidth={2} />}
        </button>
      </div>
      {showStrength ? (
        <div className="mt-2 flex items-center gap-2">
          <div className="flex flex-1 gap-1">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className="h-1.5 flex-1 rounded-full"
                style={{ background: i < st.score ? st.color : "#E2E8F0" }}
              />
            ))}
          </div>
          {st.label ? (
            <span className="text-[0.72rem] font-600" style={{ color: st.color }}>
              {st.label}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
