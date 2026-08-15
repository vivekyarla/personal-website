import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { getSession } from "@/lib/session";

// Password gate for /rox-trial. Deliberately separate from the admin password:
// this one is handed out to a third party, so it must not unlock /admin.
function matches(given: string, expected: string | undefined): boolean {
  if (!expected) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const password = typeof body.password === "string" ? body.password : "";

  if (!matches(password, process.env.ROX_PASSWORD)) {
    // Blunt throttle — one guess per second is plenty for a link you were sent.
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const session = await getSession();
  session.roxAuthed = true;
  await session.save();
  return NextResponse.json({ ok: true });
}
