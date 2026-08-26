import Link from "next/link";
import Clock from "@/components/Clock";
import CollapsibleCategory from "@/components/CollapsibleCategory";
import TweetCarousel from "@/components/TweetCarousel";
import { fetchCategories, fetchTweets } from "@/lib/tweets";

export const metadata = {
  title: "Repository",
  description:
    "A sorted collection of the tweets I find most interesting — startups, aesthetics, memes, advice, and more.",
  openGraph: {
    title: "Repository — Vivek Yarlagedda",
    description:
      "A sorted collection of the tweets I find most interesting — startups, aesthetics, memes, advice, and more.",
    url: "https://vivekyarla.com/repository",
  },
};
export const revalidate = 60;

export default async function RepositoryIndex() {
  const [tweets, categories] = await Promise.all([
    fetchTweets(),
    fetchCategories(),
  ]);

  const latest = tweets.slice(0, 10);

  // Group tweets by category id; within each category, sort by the tweet's
  // posted date (snowflake-derived), newest first.
  const byCategory = new Map<string | null, typeof tweets>();
  for (const t of tweets) {
    const key = t.category_id ?? null;
    if (!byCategory.has(key)) byCategory.set(key, []);
    byCategory.get(key)!.push(t);
  }
  const activeCategoryCount = categories.filter(
    (c) => (byCategory.get(c.id) ?? []).length > 0
  ).length;

  for (const [, list] of byCategory) {
    list.sort((a, b) => {
      const da = a.tweet_posted_at
        ? new Date(a.tweet_posted_at).getTime()
        : new Date(a.created_at).getTime();
      const db = b.tweet_posted_at
        ? new Date(b.tweet_posted_at).getTime()
        : new Date(b.created_at).getTime();
      return db - da;
    });
  }

  return (
    <div className="relative waterfall flex flex-col text-[0.9rem] pt-[clamp(1.5rem,7vh,6rem)] pb-20">
      {/* Back link — out of flow so the header sits at the shared offset */}
      <div className="absolute top-6 left-0">
        <Link
          href="/"
          className="text-xs text-muted/70 hover:text-foreground transition-colors"
        >
          ← home
        </Link>
      </div>

      {/* Header */}
      <header className="mb-8 flex items-center justify-between gap-3">
        <h1
          className={`text-2xl tracking-tight ${
            process.env.NODE_ENV === "development"
              ? "font-serif font-normal"
              : "font-semibold"
          }`}
        >
          Repository
        </h1>
        <Clock />
      </header>

      {/* Description */}
      <p className="mb-3 leading-relaxed italic text-center text-muted">
        &ldquo;If you&apos;re the smartest person in the room, you&apos;re in
        the wrong room.&rdquo;
      </p>
      <p className="mb-3 leading-relaxed italic text-center text-muted">
        &ldquo;If a smart person asks a hard question, pay attention. The rest
        of the world will ask you the same questions eventually.&rdquo;
      </p>
      <p className="mb-4 leading-relaxed text-center">
        The intersection of those two ideas are why I learn more from tweets
        than my classes.
      </p>

      {/* Collection index */}
      <p className="mb-12 text-center text-[0.72rem] text-muted/80 tabular-nums">
        {tweets.length} tweet{tweets.length === 1 ? "" : "s"} ·{" "}
        {activeCategoryCount} categor{activeCategoryCount === 1 ? "y" : "ies"}
      </p>

      {/* Latest — collapsible like the categories, but open by default */}
      {latest.length > 0 && (
        <CollapsibleCategory
          name="Latest"
          count={latest.length}
          defaultOpen
        >
          <TweetCarousel tweets={latest} showCategory />
        </CollapsibleCategory>
      )}

      {/* Per-category collapsible sections (horizontal swipe inside) */}
      <div className="blur-group">
        {categories.map((cat) => {
          const items = byCategory.get(cat.id) ?? [];
          if (items.length === 0) return null;
          return (
            <CollapsibleCategory
              key={cat.id}
              name={cat.name}
              count={items.length}
              defaultOpen={false}
              className="blur-item"
            >
              <TweetCarousel tweets={items} />
            </CollapsibleCategory>
          );
        })}
      </div>

      {tweets.length === 0 && (
        <p className="text-muted italic text-[0.85rem]">
          No tweets yet. Set up the Apple Shortcut to start saving them.
        </p>
      )}
    </div>
  );
}
