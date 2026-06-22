import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  if (!(await requireAuth())) {
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
