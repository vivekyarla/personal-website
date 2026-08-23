"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const items = [
  { href: "/admin/tasks", label: "Tasks" },
  { href: "/admin/habits", label: "Habits" },
  { href: "/admin/inbound", label: "Readings" },
];

// Persistent quick-switcher for the daily-use admin surfaces. Lives in the
// admin layout so it never remounts on navigation — the hairline underline
// slides between items while the page content swaps underneath.
export default function AdminSwitcher() {
  const pathname = usePathname();
  const wrapRef = useRef<HTMLDivElement>(null);
  const refs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [bar, setBar] = useState<{ left: number; width: number } | null>(null);
  const animate = useRef(false);

  const activeIdx = items.findIndex((i) => pathname.startsWith(i.href));

  useEffect(() => {
    function measure() {
      const el = activeIdx >= 0 ? refs.current[activeIdx] : null;
      const wrap = wrapRef.current;
      if (el && wrap) {
        const a = el.getBoundingClientRect();
        const w = wrap.getBoundingClientRect();
        setBar({ left: a.left - w.left, width: a.width });
      } else {
        setBar(null);
      }
    }
    measure();
    // Enable the slide only after the first paint so initial load doesn't sweep in.
    const t = window.setTimeout(() => (animate.current = true), 60);
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("resize", measure);
      window.clearTimeout(t);
    };
  }, [activeIdx]);

  if (activeIdx < 0) return null;

  return (
    <nav className="flex items-baseline justify-between gap-4">
      <div ref={wrapRef} className="relative blur-group flex gap-6 pb-1.5">
        {items.map((it, i) => {
          const active = i === activeIdx;
          return (
            <Link
              key={it.href}
              href={it.href}
              ref={(el) => {
                refs.current[i] = el;
              }}
              className={`blur-item text-[0.85rem] tracking-tight transition-colors ${
                active ? "text-foreground" : "text-muted hover:text-foreground"
              }`}
            >
              {it.label}
            </Link>
          );
        })}
        {bar && (
          <span
            aria-hidden
            className="absolute bottom-0 h-px bg-foreground"
            style={{
              left: bar.left,
              width: bar.width,
              transition: animate.current
                ? "left 0.4s cubic-bezier(0.22,1,0.36,1), width 0.4s cubic-bezier(0.22,1,0.36,1)"
                : "none",
            }}
          />
        )}
      </div>
      <Link
        href="/admin"
        className="text-xs text-muted/70 hover:text-foreground transition-colors"
      >
        admin ↩
      </Link>
    </nav>
  );
}
