import { NextResponse } from "next/server";
import { getSession, instinctTokenMatches } from "@/lib/session";

// Instinct sign-in: POST { token } (its INSTINCT_TOKEN, filled into the
// /admin/instinct form by its vault). Sets a session limited to tasks /
// calendar / habits / readings.
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const token = typeof body.token === "string" ? body.token : "";
  if (!token || !instinctTokenMatches(token)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const session = await getSession();
  session.agentAuthed = true;
  await session.save();
  return NextResponse.json({ ok: true });
}
