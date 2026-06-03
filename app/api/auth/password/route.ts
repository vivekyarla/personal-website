import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const password = typeof body.password === "string" ? body.password : "";

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const session = await getSession();
  session.authed = true;
  await session.save();
  return NextResponse.json({ ok: true });
}
