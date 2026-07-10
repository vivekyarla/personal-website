"use client";

import { useEffect, useRef, useState } from "react";
import type { InboundReading } from "@/lib/inbound";
import { formatInboundDate } from "@/lib/inbound";

function stripOuterQuotes(s: string): string {
  return s.replace(/^[\s"'“”‘’]+|[\s"'“”‘’]+$/g, "");
}

export default function InboundList({ items }: { items: InboundReading[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const ulRef = useRef<HTMLUListElement>(null);

  function toggle(id: string) {
    setOpen(open === id ? null : id);
  }

  // Class-driven spotlight (same technique as the tweet carousels): :hover
  // freezes during scroll, so we track the pointer and recompute the row under
  // it on every pointer move AND every page-scroll frame.
  useEffect(() => {
    const group = ulRef.current;
    if (!group) return;
    let raf = 0;
    let pt: { x: number; y: number } | null = null;

    function paint() {
      raf = 0;
      if (!group) return;
      let active: Element | null = null;
      if (pt) {
        const el = document.elementFromPoint(pt.x, pt.y);
        const item = el?.closest(".tweet-spot-item");
        if (item && group.contains(item)) active = item;
      }
      group
        .querySelectorAll(".tweet-spot-item")
        .forEach((it) => it.classList.toggle("tw-active", it === active));
      group.classList.toggle("tw-spot", !!active);
    }
    function schedule() {
      if (!raf) raf = requestAnimationFrame(paint);
    }
    function onMove(e: PointerEvent) {
      if (e.pointerType !== "mouse") return;
      pt = { x: e.clientX, y: e.clientY };
      schedule();
    }
    function onLeave() {
      pt = null;
      schedule();
    }

    group.addEventListener("pointermove", onMove);
    group.addEventListener("pointerleave", onLeave);
    window.addEventListener("scroll", schedule, { passive: true });
    return () => {
      group.removeEventListener("pointermove", onMove);
      group.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  if (items.length === 0) {
    return (
      <p className="py-3 text-muted text-[0.85rem] italic">Nothing here yet.</p>
    );
  }

  return (
    <ul ref={ulRef} className="tweet-spot-group">
      {items.map((item) => {
        const isOpen = open === item.id;
        return (
          <li
            key={item.id}
            className="tweet-spot-item relative border-t border-b border-rule -mt-px first:mt-0 first:border-t-0 last:border-b-0"
          >
            <div
              role="button"
              tabIndex={0}
              onClick={() => toggle(item.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggle(item.id);
                }
              }}
              className="py-3 cursor-pointer select-none"
            >
              <div className="leading-tight">
                {item.pinned && (
                  <span title="Pinned" className="text-[0.75rem] leading-none mr-1.5">📌</span>
                )}
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="font-medium underline decoration-rule underline-offset-4 hover:decoration-foreground"
                >
                  {item.title}
                </a>
              </div>
              <div className="mt-1 text-[0.72rem] text-muted/80 tabular-nums">
                {item.tag && (
                  <>
                    <span className="uppercase tracking-wide">{item.tag}</span>
                    <span className="mx-1.5">·</span>
                  </>
                )}
                {formatInboundDate(item.date_published)}
              </div>
              <p className="mt-1.5 text-[0.85rem] leading-relaxed text-muted">
                {item.summary}
              </p>
            </div>

            {/* Expanding quotes panel */}
            <div
              aria-hidden={!isOpen}
              className={`grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                {item.quotes.length === 0 ? (
                  <p className="pb-4 text-[0.8rem] italic text-muted/70">
                    No quotes saved for this reading.
                  </p>
                ) : (
                  <ul className="pb-5 space-y-2.5">
                    {item.quotes.map((q, i) => (
                      <li
                        key={i}
                        className={`text-[0.9rem] leading-relaxed quote-line ${
                          isOpen ? "quote-line-active" : ""
                        }`}
                        style={{ animationDelay: `${i * 110}ms` }}
                      >
                        <span className="quote-text">
                          {"“" + stripOuterQuotes(q) + "”"}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
