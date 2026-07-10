"use client";

import { useMemo, useState } from "react";
import type { InboundReading } from "@/lib/inbound";
import InboundList from "@/components/InboundList";

// Inbound list with minimal tag-filter chips. Chips mirror the tag badges on
// the rows (tiny, uppercase, hairline border); the active chip inverts.
// Clicking the active chip again clears the filter.
export default function InboundSection({ items }: { items: InboundReading[] }) {
  const [active, setActive] = useState<string | null>(null);

  const tags = useMemo(() => {
    const seen = new Set<string>();
    for (const i of items) if (i.tag) seen.add(i.tag);
    return [...seen];
  }, [items]);

  const filtered = active ? items.filter((i) => i.tag === active) : items;

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
      <InboundList items={filtered} />
    </>
  );
}
