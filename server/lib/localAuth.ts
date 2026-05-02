/**
 * Standalone local authentication — no Manus OAuth required.
 *
 * Accounts are hardcoded here. Passwords are compared in constant-time
 * to avoid timing attacks. JWTs are signed with JWT_SECRET (same key
 * already used by the platform).
 */

import { SignJWT, jwtVerify } from "jose";
import { ENV } from "../_core/env";

// ─── Hardcoded accounts ───────────────────────────────────────────────────────

const ACCOUNTS: Record<string, { password: string; displayName: string }> = {
  alex: { password: "IncreaseRoas313!", displayName: "Alex" },
  willy: { password: "IncreaseRoas313!", displayName: "Willy" },
  anthony: { password: "IncreaseRoas313!", displayName: "Anthony" },
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LocalUser {
  username: string;
  displayName: string;
}

// ─── Constant-time string comparison ─────────────────────────────────────────

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Still iterate to avoid length-based timing leak
    let diff = 0;
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
    }
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

// ─── Validate credentials ─────────────────────────────────────────────────────

export function validateCredentials(
  username: string,
  password: string
): LocalUser | null {
  const account = ACCOUNTS[username.toLowerCase().trim()];
  if (!account) return null;
  if (!safeEqual(password, account.password)) return null;
  return { username: username.toLowerCase().trim(), displayName: account.displayName };
}

// ─── JWT helpers ──────────────────────────────────────────────────────────────

const SECRET = new TextEncoder().encode(ENV.cookieSecret || "fallback-dev-secret");
const ISSUER = "ir-agency-command-center";
const AUDIENCE = "ir-agency-dashboard";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

export async function signLocalJwt(user: LocalUser): Promise<string> {
  return new SignJWT({ username: user.username, displayName: user.displayName })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(SECRET);
}

export async function verifyLocalJwt(token: string): Promise<LocalUser | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET, {
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    const username = payload["username"];
    const displayName = payload["displayName"];
    if (typeof username !== "string" || typeof displayName !== "string") return null;
    return { username, displayName };
  } catch {
    return null;
  }
}
