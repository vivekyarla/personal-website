import { NextResponse } from "next/server";
import { requireAuthOrAgent } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { fetchAllTags, fetchTasks, taskWindow } from "@/lib/tasks";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// GET ?from=YYYY-MM-DD&to=YYYY-MM-DD — tasks with due_date in range, ordered
// by day then position. Defaults to the board's window (last 14 days through
// the end of this week, PT). Also returns every tag ever used.
export async function GET(request: Request) {
  if (!(await requireAuthOrAgent(request))) {
    return NextResponse.json({ error: "unauth" }, { status: 401 });
  }
  const q = new URL(request.url).searchParams;
  const win = taskWindow();
  const from = q.get("from") ?? win.historyStart;
  const to = q.get("to") ?? win.weekEnd;
  if (!DATE_RE.test(from) || !DATE_RE.test(to)) {
    return NextResponse.json({ error: "bad date" }, { status: 400 });
  }
  const [tasks, tags] = await Promise.all([
    fetchTasks(from, to),
    fetchAllTags(),
  ]);
  return NextResponse.json({ today: win.today, from, to, tasks, tags });
}

export async function POST(request: Request) {
  if (!(await requireAuthOrAgent(request))) {
    return NextResponse.json({ error: "unauth" }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const { title, tag, due_date, position } = body as {
    title?: string;
    tag?: string | null;
    due_date?: string;
    position?: number;
  };
  if (!title?.trim() || !due_date) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }
  const { data, error } = await supabaseAdmin
    .from("tasks")
    .insert({
      title: title.trim(),
      tag: tag?.trim() || null,
      due_date,
      position: position ?? 0,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ task: data });
}
