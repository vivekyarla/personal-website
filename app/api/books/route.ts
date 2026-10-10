import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAuthOrAgent } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { fetchBooks } from "@/lib/books";
import { lookupCovers } from "@/lib/book-lookup";
import { cleanBook } from "./shared";

// GET → all books (public data). POST { title, author?, status?, read_month?,
// pages?, review?, cover_url? } creates one; without a cover_url (or pages)
// it looks the book up and fills them in. Send cover_url: null to opt out.
export async function GET() {
  return NextResponse.json({ books: await fetchBooks() });
}

export async function POST(request: Request) {
  if (!(await requireAuthOrAgent(request))) {
    return NextResponse.json({ error: "unauth" }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const { row, error } = cleanBook(body, false);
  if (error || !row) return NextResponse.json({ error }, { status: 400 });

  if (!("cover_url" in body) || !("pages" in body)) {
    const [best] = await lookupCovers(String(row.title), String(row.author ?? ""));
    if (best) {
      if (!("cover_url" in body)) row.cover_url = best.cover_url;
      if (!("pages" in body) && best.pages) row.pages = best.pages;
    }
  }
  if (row.status === "future" && !("position" in body)) {
    const { data } = await supabaseAdmin
      .from("books")
      .select("position")
      .eq("status", "future")
      .order("position", { ascending: false })
      .limit(1);
    row.position = ((data?.[0]?.position as number | undefined) ?? -1) + 1;
  }

  const { data, error: dbError } = await supabaseAdmin
    .from("books")
    .insert(row)
    .select()
    .single();
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  revalidatePath("/writing");
  return NextResponse.json({ book: data });
}
