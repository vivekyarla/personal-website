"use client";

import { useState } from "react";
import type { InboundReading } from "@/lib/inbound";
import { formatInboundDate } from "@/lib/inbound";

function stripOuterQuotes(s: string): string {
  return s.replace(/^[\s"'“”‘’]+|[\s"'“”‘’]+$/g, "");
}

export default function InboundList({ items }: { items: InboundReading[] }) {
  const [open, setOpen] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <p className="py-3 text-muted text-[0.85rem] italic">Nothing here yet.</p>
    );
  }

  return (
    <ul className="divide-y divide-rule">
      {items.map((item) => {
        const isOpen = open === item.id;
        return (
          <li key={item.id}>
            <div
              role="button"
              tabIndex={0}
              onClick={() => setOpen(isOpen ? null : item.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setOpen(isOpen ? null : item.id);
                }
              }}
              className="py-3 cursor-pointer select-none"
            >
              <div className="flex items-baseline justify-between gap-4 leading-tight">
                <div className="min-w-0 flex items-baseline gap-2 flex-wrap">
                  {item.pinned && (
                    <span title="Pinned" className="text-[0.75rem] leading-none -ml-0.5">📌</span>
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
                  {item.tag && (
                    <span className="text-[0.7rem] uppercase tracking-wide text-muted px-1.5 py-0.5 border border-rule rounded-sm">
                      {item.tag}
                    </span>
                  )}
                </div>
                <span className="text-muted text-[0.8rem] whitespace-nowrap tabular-nums">
                  {formatInboundDate(item.date_published)}
                </span>
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
