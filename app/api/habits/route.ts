import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAuthOrAgent } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  fetchEntriesSince,
  fetchHabits,
  lastNDates,
  ptToday,
} from "@/lib/habits";

// GET ?since=YYYY-MM-DD — all habits (in display order) plus the dates each
// was checked off since `since` (default: 8 weeks back, PT).
export async function GET(request: Request) {
  if (!(await requireAuthOrAgent(request))) {
    return NextResponse.json({ error: "unauth" }, { status: 401 });
  }
  const since =
    new URL(request.url).searchParams.get("since") ?? lastNDates(56)[0];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(since)) {
    return NextResponse.json({ error: "bad date" }, { status: 400 });
  }
  const [habits, entries] = await Promise.all([
    fetchHabits(),
    fetchEntriesSince(since),
  ]);
  return NextResponse.json({ today: ptToday(), since, habits, entries });
}

export async function POST(request: Request) {
  if (!(await requireAuthOrAgent(request))) {
    return NextResponse.json({ error: "unauth" }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const { name, is_core, show_chart, reminder, position } = body as {
    name?: string;
    is_core?: boolean;
    show_chart?: boolean;
    reminder?: string;
    position?: number;
  };
  if (!name) {
    return NextResponse.json({ error: "missing name" }, { status: 400 });
  }
  const { data, error } = await supabaseAdmin
    .from("habits")
    .insert({
      name,
      is_core: !!is_core,
      show_chart: !!show_chart,
      reminder: reminder ?? null,
      position: position ?? 0,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidatePath("/admin/habits");
  return NextResponse.json({ habit: data });
}
