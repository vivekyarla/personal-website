import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/session";
import { fetchCategories, fetchTweets } from "@/lib/tweets";
import AdminTweetRow from "@/components/admin/AdminTweetRow";

export const metadata = { title: "Admin · Tweets" };
export const dynamic = "force-dynamic";

export default async function AdminTweets() {
  if (!(await requireAuth())) redirect("/admin/login");
  const [tweets, categories] = await Promise.all([
    fetchTweets(),
    fetchCategories(),
  ]);
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin"
          className="text-xs text-muted/70 hover:text-foreground transition-colors"
        >
          ← admin
        </Link>
      </div>
      <header className="flex items-baseline justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Tweets</h1>
        <span className="text-xs text-muted">{tweets.length} saved</span>
      </header>

      {tweets.length === 0 ? (
        <p className="text-muted italic text-[0.85rem]">
          No tweets yet. Share a tweet via the Apple Shortcut to add one.
        </p>
      ) : (
        <ul className="divide-y divide-rule">
          {tweets.map((t) => (
            <AdminTweetRow key={t.id} tweet={t} categories={categories} />
          ))}
        </ul>
      )}
    </div>
  );
}
