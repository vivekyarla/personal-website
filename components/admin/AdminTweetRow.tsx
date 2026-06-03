"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { TweetCategory, TweetWithCategory } from "@/lib/tweets";

export default function AdminTweetRow({
  tweet,
  categories,
}: {
  tweet: TweetWithCategory;
  categories: TweetCategory[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function updateCategory(category_id: string | null) {
    setBusy(true);
    await fetch(`/api/tweets/${tweet.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category_id }),
    });
    router.refresh();
    setBusy(false);
  }

  async function del() {
    if (!confirm("Delete this tweet?")) return;
    setBusy(true);
    await fetch(`/api/tweets/${tweet.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <li className="py-3 flex items-baseline justify-between gap-4">
      <div className="min-w-0 leading-tight">
        <a
          href={tweet.url}
          target="_blank"
          rel="noreferrer"
          className="text-sm underline decoration-rule underline-offset-4 hover:decoration-foreground break-all"
        >
          {tweet.author_name ?? tweet.url}
        </a>
        <div className="text-[0.75rem] text-muted truncate">{tweet.url}</div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <select
          value={tweet.category_id ?? ""}
          disabled={busy}
          onChange={(e) =>
            updateCategory(e.target.value === "" ? null : e.target.value)
          }
          className="border border-rule rounded-sm py-1 px-2 text-xs bg-transparent"
        >
          <option value="">— Uncategorized</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={del}
          disabled={busy}
          className="text-xs text-muted hover:text-red-600 transition-colors"
        >
          Delete
        </button>
      </div>
    </li>
  );
}
