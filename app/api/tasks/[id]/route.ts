import { NextResponse } from "next/server";
import { requireAuthOrAgent } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAuthOrAgent(request))) {
    return NextResponse.json({ error: "unauth" }, { status: 401 });
  }
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const update: Record<string, unknown> = {};
  const fields = ["title", "tag", "prev_tag", "due_date", "position"] as const;
  for (const k of fields) {
    if (k in body) update[k] = body[k];
  }
  if ("done" in body) {
    update.done = !!body.done;
    update.done_at = body.done ? new Date().toISOString() : null;
  }
  const { error } = await supabaseAdmin.from("tasks").update(update).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAuthOrAgent(request))) {
    return NextResponse.json({ error: "unauth" }, { status: 401 });
  }
  const { id } = await params;
  const { error } = await supabaseAdmin.from("tasks").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
