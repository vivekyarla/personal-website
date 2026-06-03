import { supabasePublic } from "@/lib/supabase";

export type TweetCategory = {
  id: string;
  slug: string;
  name: string;
  position: number;
  created_at: string;
};

export type Tweet = {
  id: string;
  url: string;
  embed_html: string | null;
  author_name: string | null;
  author_url: string | null;
  category_id: string | null;
  note: string | null;
  tweet_posted_at: string | null;
  created_at: string;
};

export type TweetWithCategory = Tweet & {
  category: Pick<TweetCategory, "id" | "slug" | "name"> | null;
};

export async function fetchCategories(): Promise<TweetCategory[]> {
  const { data, error } = await supabasePublic
    .from("tweet_categories")
    .select("*")
    .order("position", { ascending: true });
  if (error) {
    console.error("[tweets] categories fetch:", error.message);
    return [];
  }
  return (data ?? []) as TweetCategory[];
}

export async function fetchTweets(): Promise<TweetWithCategory[]> {
  const { data, error } = await supabasePublic
    .from("tweets")
    .select(
      "id, url, embed_html, author_name, author_url, category_id, note, tweet_posted_at, created_at, category:tweet_categories(id, slug, name)"
    )
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[tweets] tweets fetch:", error.message);
    return [];
  }
  return (data ?? []) as unknown as TweetWithCategory[];
}

export async function fetchTweetsByCategorySlug(
  slug: string
): Promise<TweetWithCategory[]> {
  const { data: cat } = await supabasePublic
    .from("tweet_categories")
    .select("id")
    .eq("slug", slug)
    .single();
  if (!cat) return [];
  const { data, error } = await supabasePublic
    .from("tweets")
    .select(
      "id, url, embed_html, author_name, author_url, category_id, note, tweet_posted_at, created_at, category:tweet_categories(id, slug, name)"
    )
    .eq("category_id", cat.id)
    .order("tweet_posted_at", { ascending: false, nullsFirst: false });
  if (error) {
    console.error("[tweets] tweets by cat:", error.message);
    return [];
  }
  return (data ?? []) as unknown as TweetWithCategory[];
}

// Extract the snowflake tweet ID from a tweet URL.
export function tweetIdFromUrl(url: string): string | null {
  const m = url.match(/\/status\/(\d+)/);
  return m ? m[1] : null;
}

// Twitter snowflake IDs encode a millisecond timestamp in the upper bits.
// epoch = Nov 4 2010, ((id >> 22) + epoch) yields ms since Unix epoch.
export function tweetDateFromUrl(url: string): Date | null {
  const id = tweetIdFromUrl(url);
  if (!id) return null;
  try {
    const TWITTER_EPOCH = 1288834974657n;
    const ms = Number((BigInt(id) >> 22n) + TWITTER_EPOCH);
    if (!Number.isFinite(ms) || ms <= 0) return null;
    return new Date(ms);
  } catch {
    return null;
  }
}

export function isTweetUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (!["twitter.com", "x.com", "mobile.twitter.com"].includes(u.hostname)) {
      return false;
    }
    return /\/status\/\d+/.test(u.pathname);
  } catch {
    return false;
  }
}
