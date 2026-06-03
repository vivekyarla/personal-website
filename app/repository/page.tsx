import Link from "next/link";
import Clock from "@/components/Clock";
import TweetCard from "@/components/TweetCard";
import TwitterEmbeds from "@/components/TwitterEmbeds";
import { fetchCategories, fetchTweets } from "@/lib/tweets";

export const metadata = { title: "Repository" };
export const revalidate = 60;

export default async function RepositoryIndex() {
  const [tweets, categories] = await Promise.all([
    fetchTweets(),
    fetchCategories(),
  ]);

  const latest = tweets.slice(0, 6);

  // Group tweets by category id; within each category, sort by the tweet's
  // posted date (snowflake-derived), newest first.
  const byCategory = new Map<string | null, typeof tweets>();
  for (const t of tweets) {
    const key = t.category_id ?? null;
    if (!byCategory.has(key)) byCategory.set(key, []);
    byCategory.get(key)!.push(t);
  }
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
    <div className="waterfall flex flex-col text-[0.9rem] pt-12 sm:pt-24 pb-20">
      {/* Back link */}
      <div className="mb-8">
        <Link
          href="/"
          className="text-xs text-muted/70 hover:text-foreground transition-colors"
        >
          ← home
        </Link>
      </div>

      {/* Header */}
      <header className="mb-8 flex items-baseline justify-between gap-3">
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
        &ldquo;If a smart person asks you a hard question, pay attention. The
        rest of the world will ask you the same question eventually.&rdquo;
      </p>
      <p className="mb-12 leading-relaxed text-center">
        The intersection of those two ideas are why I learn more from tweets
        than my classes.
      </p>

      {/* Latest */}
      {latest.length > 0 && (
        <section className="mb-12">
          <h2 className="text-base font-semibold tracking-tight mb-3">
            Latest
          </h2>
          <hr className="border-rule mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {latest.map((t) => (
              <TweetCard key={t.id} tweet={t} />
            ))}
          </div>
        </section>
      )}

      {/* Per-category sections */}
      {categories.map((cat) => {
        const items = byCategory.get(cat.id) ?? [];
        if (items.length === 0) return null;
        return (
          <section key={cat.id} className="mb-12">
            <h2 className="text-base font-semibold tracking-tight mb-3">
              {cat.name}
            </h2>
            <hr className="border-rule mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {items.map((t) => (
                <TweetCard key={t.id} tweet={t} />
              ))}
            </div>
          </section>
        );
      })}

      {tweets.length === 0 && (
        <p className="text-muted italic text-[0.85rem]">
          No tweets yet. Set up the Apple Shortcut to start saving them.
        </p>
      )}

      <TwitterEmbeds />
    </div>
  );
}
