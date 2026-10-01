import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getIronSession, IronSession, SessionOptions } from "iron-session";
import { supabaseAdmin } from "@/lib/supabase-admin";

export type SessionData = {
  // Admin sign-in (passkey only). `authedAt` (ms) bounds its lifetime and
  // lets "sign out everywhere" invalidate it — see sessionValid().
  authed?: boolean;
  authedAt?: number;
  // Unlisted, password-gated pages. Separate from `authed` so the admin
  // sign-in is never what opens them (and vice versa).
  roxAuthed?: boolean;
  // Instinct (AI assistant) browser session: unlocks only tasks / calendar /
  // habits / readings — never the rest of the admin.
  agentAuthed?: boolean;
  agentAuthedAt?: number;
  // Recovery-code sign-in: for ~10 minutes it may only enroll a new passkey.
  recoveryAt?: number;
  // Transient values stored across multi-step passkey ceremonies.
  webauthnChallenge?: string;
  webauthnUserId?: string;
};

const DAY = 24 * 60 * 60 * 1000;
export const ADMIN_SESSION_MS = 7 * DAY;
export const AGENT_SESSION_MS = 7 * DAY;
export const RECOVERY_WINDOW_MS = 10 * 60 * 1000;

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: "vy_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    // The cookie can outlive a sign-in (the Rox pass keeps 30 days); admin
    // and Instinct sign-ins expire server-side via their *At timestamps.
    maxAge: 60 * 60 * 24 * 30,
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}

/* ---- "Sign out everywhere": sign-ins older than the epoch are void ---- */

// auth_epoch is a single-row table; bumping it (POST /api/auth/revoke-all)
// voids every existing admin + Instinct sign-in. Cached briefly per instance.
let epochCache: { value: number; exp: number } | null = null;

async function authEpoch(): Promise<number> {
  if (epochCache && epochCache.exp > Date.now()) return epochCache.value;
  const { data, error } = await supabaseAdmin
    .from("auth_epoch")
    .select("epoch")
    .eq("id", 1)
    .maybeSingle();
  if (error) console.error("[session] auth_epoch:", error.message);
  const value = data?.epoch ? Date.parse(data.epoch as string) : 0;
  epochCache = { value, exp: Date.now() + 15 * 1000 };
  return value;
}

export async function revokeAllSessions(): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from("auth_epoch")
    .upsert({ id: 1, epoch: new Date().toISOString() }, { onConflict: "id" });
  if (error) {
    console.error("[session] revoke:", error.message);
    return false;
  }
  epochCache = null;
  return true;
}

async function sessionValid(at: number | undefined, maxAge: number) {
  if (!at || Date.now() - at > maxAge) return false;
  return at > (await authEpoch());
}

export async function requireAuth(): Promise<boolean> {
  const session = await getSession();
  return !!session.authed && (await sessionValid(session.authedAt, ADMIN_SESSION_MS));
}

// Constant-time comparison for shared secrets (tokens, recovery code).
export function secretMatches(given: string, expected: string | undefined) {
  if (!expected || expected.length < 32) return false;
  const a = Buffer.from(given.trim());
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Instinct (AI assistant) access: `Authorization: Bearer <INSTINCT_TOKEN>`.
// Accepted only by the tasks / calendar / habits / readings routes (they call
// requireAuthOrAgent); everything else stays admin-session-only. Rotate or
// unset INSTINCT_TOKEN in Vercel to revoke.
// The same token can also be typed into /admin/instinct (for browser
// agents whose vault only fills form fields), which sets `agentAuthed`.
export function instinctTokenMatches(token: string): boolean {
  return secretMatches(token, process.env.INSTINCT_TOKEN);
}

function agentTokenValid(request: Request): boolean {
  const header = request.headers.get("authorization") ?? "";
  return header.startsWith("Bearer ") && instinctTokenMatches(header.slice(7));
}

// Pages in the four shared areas: admin or Instinct's browser session.
export async function requireAuthOrAgentSession(): Promise<boolean> {
  const session = await getSession();
  if (session.authed && (await sessionValid(session.authedAt, ADMIN_SESSION_MS)))
    return true;
  return (
    !!session.agentAuthed &&
    (await sessionValid(session.agentAuthedAt, AGENT_SESSION_MS))
  );
}

// API routes in the four shared areas: admin session, Instinct's browser
// session, or its bearer token.
export async function requireAuthOrAgent(request: Request): Promise<boolean> {
  return agentTokenValid(request) || (await requireAuthOrAgentSession());
}

// Recovery-code sign-in, valid briefly and only for enrolling a passkey.
export async function requireRecovery(): Promise<boolean> {
  const session = await getSession();
  return sessionValid(session.recoveryAt, RECOVERY_WINDOW_MS);
}

export async function requireRoxAuth(): Promise<boolean> {
  const session = await getSession();
  return !!session.roxAuthed;
}
