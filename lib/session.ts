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

export async function requireRoxAuth(): Promise<boolean> {
  const session = await getSession();
  return !!session.roxAuthed;
}
