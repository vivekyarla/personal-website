import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { supabasePublic } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabasePublic
    .from("tweet_categories")
    .select("*")
    .order("position", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ categories: data });
}

export async function POST(request: Request) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "unauth" }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const { name, slug, position } = body as {
    name?: string;
    slug?: string;
    position?: number;
  };
  if (!name || !slug) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }
  const { data, error } = await supabaseAdmin
    .from("tweet_categories")
    .insert({
      name,
      slug: slug.toLowerCase().replace(/\s+/g, "-"),
      position: position ?? 0,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidatePath("/repository");
  return NextResponse.json({ category: data });
}
