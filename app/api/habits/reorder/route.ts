import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-admin";

// Body: { ids: string[] } — new order, index becomes position.
export async function POST(request: Request) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "unauth" }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const ids = Array.isArray(body.ids) ? (body.ids as string[]) : null;
  if (!ids) {
    return NextResponse.json({ error: "missing ids" }, { status: 400 });
  }
  await Promise.all(
    ids.map((id, i) =>
      supabaseAdmin.from("habits").update({ position: i }).eq("id", id)
    )
  );
  revalidatePath("/admin/habits");
  return NextResponse.json({ ok: true });
}
