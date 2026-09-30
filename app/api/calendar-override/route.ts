import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-admin";

// Local rename/hide for a calendar event (never written back to Google
// Calendar). POST { uid, date_key, custom_title?, hidden? } — date_key "" means
// every occurrence, "YYYY-MM-DD" just that day. Only the fields sent are
// changed; an empty custom_title resets the name. Rows left with nothing to
// override are deleted.
export async function POST(request: Request) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "unauth" }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const { uid, date_key = "", custom_title, hidden } = body as {
    uid?: string;
    date_key?: string;
    custom_title?: string | null;
    hidden?: boolean;
  };
  if (!uid) return NextResponse.json({ error: "missing uid" }, { status: 400 });
  if (date_key !== "" && !/^\d{4}-\d{2}-\d{2}$/.test(date_key)) {
    return NextResponse.json({ error: "bad date_key" }, { status: 400 });
  }

  const patch: { custom_title?: string | null; hidden?: boolean } = {};
  if (custom_title !== undefined) patch.custom_title = custom_title?.trim() || null;
  if (typeof hidden === "boolean") patch.hidden = hidden;
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "nothing to change" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("calendar_event_overrides")
    .upsert(
      { uid, date_key, ...patch, updated_at: new Date().toISOString() },
      { onConflict: "uid,date_key" }
    );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { error: cleanupError } = await supabaseAdmin
    .from("calendar_event_overrides")
    .delete()
    .eq("uid", uid)
    .eq("date_key", date_key)
    .is("custom_title", null)
    .eq("hidden", false);
  if (cleanupError)
    return NextResponse.json({ error: cleanupError.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
