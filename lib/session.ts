import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getIronSession, IronSession, SessionOptions } from "iron-session";

export type SessionData = {
  authed?: boolean;
  // Unlisted, password-gated pages. Separate from `authed` so the admin
  // password is never what opens them (and vice versa).
  roxAuthed?: boolean;
  // Transient values stored across multi-step passkey ceremonies.
  webauthnChallenge?: string;
  webauthnUserId?: string;
};

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: "vy_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}

export async function requireAuth(): Promise<boolean> {
  const session = await getSession();
  return !!session.authed;
}

// Instinct (AI assistant) access: `Authorization: Bearer <INSTINCT_TOKEN>`.
// Accepted only by the tasks / calendar / habits / readings routes (they call
// requireAuthOrAgent); everything else stays admin-session-only. Rotate or
// unset INSTINCT_TOKEN in Vercel to revoke.
function agentTokenValid(request: Request): boolean {
  const expected = process.env.INSTINCT_TOKEN;
  if (!expected || expected.length < 32) return false;
  const header = request.headers.get("authorization") ?? "";
  if (!header.startsWith("Bearer ")) return false;
  const got = Buffer.from(header.slice(7).trim());
  const want = Buffer.from(expected);
  return got.length === want.length && timingSafeEqual(got, want);
}

export async function requireAuthOrAgent(request: Request): Promise<boolean> {
  return agentTokenValid(request) || (await requireAuth());
}

export async function requireRoxAuth(): Promise<boolean> {
  const session = await getSession();
  return !!session.roxAuthed;
}
