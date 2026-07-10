"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { InboundReading } from "@/lib/inbound";
import InboundList from "@/components/InboundList";

// Inbound list with minimal tag-filter chips. Chips mirror the tag badges on
// the rows; the active chip inverts. Clicking the active chip again clears.
// Filter changes crossfade: the list blurs/fades out, swaps, and fades back —
// matching the site's spotlight-blur language.
export default function InboundSection({ items }: { items: InboundReading[] }) {
  const [active, setActive] = useState<string | null>(null); // chip state (instant)
  const [shown, setShown] = useState<string | null>(null); // filter actually rendered
  const [fading, setFading] = useState(false);
  const timer = useRef<number | null>(null);

  const tags = useMemo(() => {
    const seen = new Set<string>();
    for (const i of items) if (i.tag) seen.add(i.tag);
    return [...seen];
  }, [items]);

  function pick(t: string) {
    const next = active === t ? null : t;
    setActive(next);
    if (next === shown) return;
    setFading(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setShown(next);
      setFading(false);
      timer.current = null;
    }, 220);
  }

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  const filtered = shown ? items.filter((i) => i.tag === shown) : items;

  return (
    <>
      {tags.length > 1 && (
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {tags.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => pick(t)}
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
      <div
        className={`transition-[opacity,filter] duration-300 ease-out ${
          fading ? "opacity-0 blur-[2.4px]" : "opacity-100 blur-0"
        }`}
      >
        <InboundList items={filtered} />
      </div>
    </>
  );
}
