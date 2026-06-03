import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { supabasePublic } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function GET() {
  const { data, error } = await supabasePublic
    .from("inbound_readings")
    .select("*")
    .order("date_read", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ readings: data });
}

export async function POST(request: Request) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "unauth" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const {
    title,
    url,
    source,
    tag,
    date_read,
    summary,
    quotes,
  } = body as {
    title?: string;
    url?: string;
    source?: string;
    tag?: string;
    date_read?: string;
    summary?: string;
    quotes?: string[];
  };

  if (!title || !url || !summary) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("inbound_readings")
    .insert({
      title,
      url,
      source: source ?? null,
      tag: tag ?? null,
      date_read: date_read ?? new Date().toISOString().slice(0, 10),
      summary,
      quotes: Array.isArray(quotes) ? quotes.filter((q) => q.trim().length > 0) : [],
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidatePath("/writing");
  return NextResponse.json({ reading: data });
}
