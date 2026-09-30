import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getIronSession, IronSession, SessionOptions } from "iron-session";

export type SessionData = {
  authed?: boolean;
  // Unlisted, password-gated pages. Separate from `authed` so the admin
  // password is never what opens them (and vice versa).
  roxAuthed?: boolean;
  // Instinct (AI assistant) browser session: unlocks only tasks / calendar /
  // habits / readings — never the rest of the admin.
  agentAuthed?: boolean;
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
// The same token can also be typed into /admin/instinct (for browser
// agents whose vault only fills form fields), which sets `agentAuthed`.
export function instinctTokenMatches(token: string): boolean {
  const expected = process.env.INSTINCT_TOKEN;
  if (!expected || expected.length < 32) return false;
  const got = Buffer.from(token.trim());
  const want = Buffer.from(expected);
  return got.length === want.length && timingSafeEqual(got, want);
}

function agentTokenValid(request: Request): boolean {
  const header = request.headers.get("authorization") ?? "";
  return header.startsWith("Bearer ") && instinctTokenMatches(header.slice(7));
}

// Pages in the four shared areas: admin or Instinct's browser session.
export async function requireAuthOrAgentSession(): Promise<boolean> {
  const session = await getSession();
  return !!session.authed || !!session.agentAuthed;
}

// API routes in the four shared areas: admin session, Instinct's browser
// session, or its bearer token.
export async function requireAuthOrAgent(request: Request): Promise<boolean> {
  return agentTokenValid(request) || (await requireAuthOrAgentSession());
}

export async function requireRoxAuth(): Promise<boolean> {
  const session = await getSession();
  return !!session.roxAuthed;
}
