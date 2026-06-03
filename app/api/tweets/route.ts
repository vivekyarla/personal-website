import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { supabasePublic } from "@/lib/supabase";
import { isTweetUrl } from "@/lib/tweets";
import { fetchTweetEmbed } from "@/lib/twitter-oembed";

// GET: public list
export async function GET() {
  const { data, error } = await supabasePublic
    .from("tweets")
    .select(
      "id, url, embed_html, author_name, author_url, category_id, note, created_at, category:tweet_categories(id, slug, name)"
    )
    .order("created_at", { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ tweets: data });
}

// POST: capture endpoint. Accepts either:
//  - admin session (logged in)
//  - Bearer token (CAPTURE_TOKEN) — used by Apple Shortcut
// Body: { url, category_slug?, category_id?, note? }
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";
  const bearerOk =
    authHeader.startsWith("Bearer ") &&
    authHeader.slice(7) === process.env.CAPTURE_TOKEN &&
    !!process.env.CAPTURE_TOKEN;

  if (!bearerOk && !(await requireAuth())) {
    return NextResponse.json({ error: "unauth" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { url, category_slug, category_id, note } = body as {
    url?: string;
    category_slug?: string;
    category_id?: string;
    note?: string;
  };

  if (!url || !isTweetUrl(url)) {
    return NextResponse.json(
      { error: "invalid tweet url" },
      { status: 400 }
    );
  }

  // Resolve category
  let resolvedCategoryId: string | null = null;
  if (category_id) {
    resolvedCategoryId = category_id;
  } else if (category_slug) {
    const { data: cat } = await supabaseAdmin
      .from("tweet_categories")
      .select("id")
      .eq("slug", category_slug.toLowerCase())
      .single();
    resolvedCategoryId = cat?.id ?? null;
    if (!resolvedCategoryId) {
      return NextResponse.json(
        { error: `unknown category: ${category_slug}` },
        { status: 400 }
      );
    }
  }

  // Fetch embed HTML from Twitter oEmbed
  const oembed = await fetchTweetEmbed(url);

  // Insert (upsert on URL to dedupe)
  const { data, error } = await supabaseAdmin
    .from("tweets")
    .upsert(
      {
        url,
        embed_html: oembed?.html ?? null,
        author_name: oembed?.author_name ?? null,
        author_url: oembed?.author_url ?? null,
        category_id: resolvedCategoryId,
        note: note ?? null,
      },
      { onConflict: "url" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidatePath("/repository");
  return NextResponse.json({ ok: true, tweet: data });
}
