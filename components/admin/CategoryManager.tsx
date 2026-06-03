"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TweetCategory } from "@/lib/tweets";

export default function CategoryManager({
  initial,
}: {
  initial: TweetCategory[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: (slug.trim() || name.trim().toLowerCase().replace(/\s+/g, "-")),
          position: initial.length,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "failed");
      }
      setName("");
      setSlug("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed");
    } finally {
      setBusy(false);
    }
  }

  async function del(id: string) {
    if (!confirm("Delete category? Tweets in it will become uncategorized.")) return;
    await fetch(`/api/categories/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      {initial.length === 0 ? (
        <p className="text-muted italic text-[0.85rem]">No categories yet.</p>
      ) : (
        <ul className="divide-y divide-rule">
          {initial.map((c) => (
            <li key={c.id} className="py-3 flex items-baseline justify-between gap-4">
              <div className="leading-tight">
                <div className="font-medium">{c.name}</div>
                <code className="text-[0.75rem] text-muted">{c.slug}</code>
              </div>
              <button
                type="button"
                onClick={() => del(c.id)}
                className="text-xs text-muted hover:text-red-600 transition-colors"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={add} className="flex flex-col gap-3 border-t border-rule pt-6">
        <div className="text-xs uppercase tracking-wide text-muted">New category</div>
        <div className="grid grid-cols-2 gap-3">
          <input
            required
            placeholder="Name (e.g. Startups)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border border-rule rounded-sm py-2 px-3 text-sm bg-transparent focus:outline-none focus:border-foreground"
          />
          <input
            placeholder="Slug (auto from name if blank)"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="border border-rule rounded-sm py-2 px-3 text-sm bg-transparent focus:outline-none focus:border-foreground"
          />
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={busy || name.trim().length === 0}
          className="self-start border border-foreground bg-foreground text-background rounded-sm py-2 px-4 text-sm hover:opacity-80 transition-opacity disabled:opacity-50"
        >
          {busy ? "…" : "Add"}
        </button>
      </form>
    </div>
  );
}
