import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-admin";

// Set a habit's done-state for a given date. Body: { habit_id, date, done }
export async function POST(request: Request) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "unauth" }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const { habit_id, date, done } = body as {
    habit_id?: string;
    date?: string;
    done?: boolean;
  };
  if (!habit_id || !date) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  if (done) {
    const { error } = await supabaseAdmin
      .from("habit_entries")
      .upsert({ habit_id, date, done: true }, { onConflict: "habit_id,date" });
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    // Unchecking: remove the row entirely.
    const { error } = await supabaseAdmin
      .from("habit_entries")
      .delete()
      .eq("habit_id", habit_id)
      .eq("date", date);
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
