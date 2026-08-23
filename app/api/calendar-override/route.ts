import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-admin";

// Local rename for a calendar event (never written back to Google Calendar).
// POST { uid, custom_title } upserts; empty/missing custom_title resets.
export async function POST(request: Request) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "unauth" }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const { uid, custom_title } = body as { uid?: string; custom_title?: string };
  if (!uid) return NextResponse.json({ error: "missing uid" }, { status: 400 });

  if (!custom_title?.trim()) {
    const { error } = await supabaseAdmin
      .from("calendar_overrides")
      .delete()
      .eq("uid", uid);
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, reset: true });
  }

  const { error } = await supabaseAdmin
    .from("calendar_overrides")
    .upsert({ uid, custom_title: custom_title.trim() }, { onConflict: "uid" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
