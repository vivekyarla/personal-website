import { NextResponse } from "next/server";
import { getSession, secretMatches } from "@/lib/session";

// Emergency recovery when no passkey is at hand: POST { code } with
// ADMIN_RECOVERY_CODE (Vercel env, 32+ chars). Success doesn't sign you in —
// it allows enrolling one new passkey within 10 minutes (/admin/recover).
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const code = typeof body.code === "string" ? body.code : "";
  if (!code || !secretMatches(code, process.env.ADMIN_RECOVERY_CODE)) {
    await new Promise((r) => setTimeout(r, 1500));
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const session = await getSession();
  session.recoveryAt = Date.now();
  await session.save();
  return NextResponse.json({ ok: true });
}
