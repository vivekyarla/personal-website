import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
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
  for (const k of ["name", "is_core", "show_chart", "reminder", "position"] as const) {
    if (k in body) update[k] = body[k];
  }
  const { error } = await supabaseAdmin
    .from("habits")
    .update(update)
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidatePath("/admin/habits");
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
  const { error } = await supabaseAdmin.from("habits").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidatePath("/admin/habits");
  return NextResponse.json({ ok: true });
}
