import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { timingSafeEqual } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { isTweetUrl, tweetDateFromUrl } from "@/lib/tweets";
import { fetchTweetEmbed } from "@/lib/twitter-oembed";

// Headless tweet capture for Instinct (it can only make plain GET requests).
//
//   GET /api/capture/tweet?url=<tweet url>&category=<slug>&note=<optional>&key=<TWEET_CAPTURE_KEY>
//
// The key can also be sent as "Authorization: Bearer <key>". It is separate
// from CAPTURE_TOKEN and INSTINCT_TOKEN and only ever allows saving a tweet
// into an existing category. Rotate or delete TWEET_CAPTURE_KEY to revoke.
// Mirrors the POST logic in app/api/tweets/route.ts (same upsert on URL).

export const dynamic = "force-dynamic";

const MAX_PER_HOUR = 30;
const hits: number[] = []; // per server instance; coarse backstop only

function rateLimited(): boolean {
  const now = Date.now();
  while (hits.length && now - hits[0] > 60 * 60 * 1000) hits.shift();
  if (hits.length >= MAX_PER_HOUR) return true;
  hits.push(now);
  return false;
}

function keyOk(provided: string): boolean {
  const expected = process.env.TWEET_CAPTURE_KEY;
  if (!expected || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const header = request.headers.get("authorization") ?? "";
  const provided = header.startsWith("Bearer ")
    ? header.slice(7)
    : (searchParams.get("key") ?? "");

  if (!keyOk(provided)) {
    return NextResponse.json({ error: "unauth" }, { status: 401 });
  }
  if (rateLimited()) {
    return NextResponse.json({ error: "rate limited" }, { status: 429 });
  }

  const raw = searchParams.get("url") ?? "";
  const category = (searchParams.get("category") ?? "").trim().toLowerCase();
  const note = searchParams.get("note");

  // Normalize: drop tracking params like ?s=10 so the same tweet dedupes.
  let url = raw;
  try {
    const u = new URL(raw);
    url = `${u.protocol}//${u.host}${u.pathname}`;
  } catch {
    /* handled by isTweetUrl below */
  }
  if (!url || !isTweetUrl(url)) {
    return NextResponse.json({ error: "invalid tweet url" }, { status: 400 });
  }
  if (!category) {
    return NextResponse.json({ error: "category required" }, { status: 400 });
  }

  const { data: cat } = await supabaseAdmin
    .from("tweet_categories")
    .select("id, slug, name")
    .eq("slug", category)
    .maybeSingle();
  if (!cat) {
    return NextResponse.json(
      { error: `unknown category: ${category}` },
      { status: 400 }
    );
  }

  const oembed = await fetchTweetEmbed(url);
  const postedAt = tweetDateFromUrl(url);

  const { data, error } = await supabaseAdmin
    .from("tweets")
    .upsert(
      {
        url,
        embed_html: oembed?.html ?? null,
        author_name: oembed?.author_name ?? null,
        author_url: oembed?.author_url ?? null,
        category_id: cat.id,
        note: note ?? null,
        tweet_posted_at: postedAt ? postedAt.toISOString() : null,
      },
      { onConflict: "url" }
    )
    .select("id, url, author_name, category_id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidatePath("/repository");
  return NextResponse.json({
    ok: true,
    tweet: data,
    category: { slug: cat.slug, name: cat.name },
  });
}
