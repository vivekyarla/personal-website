"use client";

import { useMemo, useRef, useState } from "react";
import type { InboundReading } from "@/lib/inbound";
import { useScrollSpotlight } from "@/components/useScrollSpotlight";

// Books column: permanently sorted by date finished (newest first), but the
// only visible separators are year labels — within a year the day/month
// ordering is invisible. No quotes, no expansion.
export default function BooksSection({ items }: { items: InboundReading[] }) {
  const [active, setActive] = useState<string | null>(null);
  const ulRef = useRef<HTMLDivElement>(null);
  useScrollSpotlight(ulRef);

  const tags = useMemo(() => {
    const seen = new Set<string>();
    for (const i of items) if (i.tag) seen.add(i.tag);
    return [...seen];
  }, [items]);

  const filtered = active ? items.filter((i) => i.tag === active) : items;

  // Sort by date desc, then group into years (desc by construction).
  const years = useMemo(() => {
    const sorted = [...filtered].sort((a, b) =>
      b.date_published.localeCompare(a.date_published)
    );
    const groups: { year: string; books: InboundReading[] }[] = [];
    for (const b of sorted) {
      const year = b.date_published.slice(0, 4);
      const last = groups[groups.length - 1];
      if (last && last.year === year) last.books.push(b);
      else groups.push({ year, books: [b] });
    }
    return groups;
  }, [filtered]);

  if (items.length === 0) {
    return (
      <p className="py-3 text-muted text-[0.85rem] italic">Nothing here yet.</p>
    );
  }

  return (
    <>
      {tags.length > 1 && (
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {tags.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setActive(active === t ? null : t)}
              aria-pressed={active === t}
              className={`text-[0.7rem] uppercase tracking-wide px-1.5 py-0.5 border rounded-sm transition-colors cursor-pointer ${
                active === t
                  ? "border-foreground bg-foreground text-background"
                  : "border-rule text-muted hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      )}
      <div ref={ulRef} className="tweet-spot-group">
        {years.map(({ year, books }) => (
          <div key={year}>
            <div className="pt-3 pb-1 text-[0.68rem] uppercase tracking-wide text-muted/80 tabular-nums first:pt-0">
              {year}
            </div>
            <ul>
              {books.map((b) => (
                <li
                  key={b.id}
                  className="tweet-spot-item relative border-t border-b border-rule -mt-px first:mt-0 first:border-t-0 last:border-b-0 py-3"
                >
                  <div className="leading-tight">
                    {b.url ? (
                      <a
                        href={b.url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium underline decoration-rule underline-offset-4 hover:decoration-foreground"
                      >
                        {b.title}
                      </a>
                    ) : (
                      <span className="font-medium">{b.title}</span>
                    )}
                    {b.source && (
                      <span className="text-muted"> — {b.source}</span>
                    )}
                  </div>
                  {b.tag && (
                    <div className="mt-1 text-[0.72rem] text-muted/80 uppercase tracking-wide">
                      {b.tag}
                    </div>
                  )}
                  {b.summary && (
                    <p className="mt-1.5 text-[0.85rem] leading-relaxed text-muted">
                      {b.summary}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </>
  );
}
