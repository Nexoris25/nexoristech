"use server";
/**
 * Sign-in, sign-out, and forgot-password server actions (PRD 1.1). Sign-in verifies the email and
 * bcrypt password against the active staff record, then sets the signed session cookie; "keep me
 * signed in" extends the session from one day to thirty. No detail about which part failed is
 * leaked. Forgot-password records a reset request for an Admin to act on (no mail service is wired
 * in this phase) and always answers the same way, so it never confirms whether an email exists.
 */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { db } from "./db.js";
import {
  createSession,
  REMEMBER_SESSION_MAX_AGE,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  type SessionPayload,
} from "./session.js";

export interface SignInState {
  error?: string;
}

export async function signIn(
  _prev: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const remember = formData.get("remember") === "on";
  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const { rows } = await db().query<{
    id: string;
    name: string;
    role: SessionPayload["role"];
    password_hash: string;
  }>(
    "SELECT id, name, role, password_hash FROM staff WHERE email = $1 AND active = true",
    [email],
  );
  const staff = rows[0];
  const ok = staff ? await bcrypt.compare(password, staff.password_hash) : false;
  if (!staff || !ok) {
    return { error: "Those details did not match. Please try again." };
  }

  const token = createSession(
    { id: staff.id, role: staff.role, name: staff.name },
    remember,
  );
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: remember ? REMEMBER_SESSION_MAX_AGE : SESSION_MAX_AGE,
  });
  redirect("/dashboard");
}

export async function signOut(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}

export interface ForgotPasswordState {
  done?: boolean;
  error?: string;
}

export async function requestPasswordReset(
  _prev: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return { error: "Enter the email you sign in with." };
  }

  // Record the request whether or not the email matches a staff account, and answer identically,
  // so this form cannot be used to probe which emails exist.
  const { rows } = await db().query<{ id: string }>(
    "SELECT id FROM staff WHERE email = $1 AND active = true",
    [email],
  );
  await db().query(
    "INSERT INTO password_reset_request (email, staff_id) VALUES ($1, $2)",
    [email, rows[0]?.id ?? null],
  );
  return { done: true };
}
