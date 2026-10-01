import { NextResponse } from "next/server";
import { getSession, requireAuth, revokeAllSessions } from "@/lib/session";

// "Sign out everywhere": voids every admin and Instinct sign-in (all
// devices, including this one) by bumping auth_epoch.
export async function POST() {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "unauth" }, { status: 401 });
  }
  if (!(await revokeAllSessions())) {
    return NextResponse.json({ error: "could not revoke" }, { status: 500 });
  }
  const session = await getSession();
  session.destroy();
  return NextResponse.json({ ok: true });
}
