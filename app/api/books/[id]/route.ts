import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAuthOrAgent } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { cleanBook } from "../shared";

// PATCH → update any of { title, author, status, read_month, pages, review,
// cover_url, position }. DELETE → remove.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAuthOrAgent(request))) {
    return NextResponse.json({ error: "unauth" }, { status: 401 });
  }
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const { row, error } = cleanBook(body, true);
  if (error || !row) return NextResponse.json({ error }, { status: 400 });
  if (Object.keys(row).length === 0) {
    return NextResponse.json({ error: "nothing to change" }, { status: 400 });
  }
  const { error: dbError } = await supabaseAdmin.from("books").update(row).eq("id", id);
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  revalidatePath("/writing");
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
  const { error } = await supabaseAdmin.from("books").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidatePath("/writing");
  return NextResponse.json({ ok: true });
}
