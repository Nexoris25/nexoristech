"use server";
/**
 * Sign-in and sign-out server actions (PRD 1.1). Sign-in verifies the email and bcrypt password
 * against the active staff record, then sets the signed session cookie. No detail about which part
 * failed is leaked. Sign-out clears the cookie.
 */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { db } from "./db.js";
import {
  createSession,
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

  const token = createSession({ id: staff.id, role: staff.role, name: staff.name });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  redirect("/crm");
}

export async function signOut(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}
