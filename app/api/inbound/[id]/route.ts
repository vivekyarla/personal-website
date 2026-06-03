import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "unauth" }, { status: 401 });
  }
  const { id } = await params;
  const { error } = await supabaseAdmin
    .from("inbound_readings")
    .delete()
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidatePath("/writing");
  return NextResponse.json({ ok: true });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "unauth" }, { status: 401 });
  }
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const update: Record<string, unknown> = {};
  for (const key of ["title", "url", "source", "tag", "date_read", "summary", "quotes"] as const) {
    if (key in body) update[key] = body[key];
  }
  const { error } = await supabaseAdmin
    .from("inbound_readings")
    .update(update)
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidatePath("/writing");
  return NextResponse.json({ ok: true });
}
