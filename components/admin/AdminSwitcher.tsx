"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const items = [
  { href: "/admin/tasks", label: "Tasks" },
  { href: "/admin/habits", label: "Habits" },
  { href: "/admin/inbound", label: "Readings" },
];

// Persistent quick-switcher for the daily-use admin surfaces. Lives in the
// admin layout so it never remounts on navigation — the hairline underline
// slides between items while the page content swaps underneath. The slide is
// optimistic: it starts the moment you click (or press 1/2/3), not when the
// server responds.
export default function AdminSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const wrapRef = useRef<HTMLDivElement>(null);
  const refs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [bar, setBar] = useState<{ left: number; width: number } | null>(null);
  const [pending, setPending] = useState<number | null>(null);
  const animate = useRef(false);

  const pathIdx = items.findIndex((i) => pathname.startsWith(i.href));
  const activeIdx = pending ?? pathIdx;

  // Navigation landed — clear the optimistic index.
  useEffect(() => {
    setPending(null);
  }, [pathname]);

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
    const t = window.setTimeout(() => (animate.current = true), 60);
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("resize", measure);
      window.clearTimeout(t);
    };
  }, [activeIdx]);

  // Keyboard: 1/2/3 jump between Tasks/Habits/Readings (ignored while typing).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.tagName === "SELECT" ||
          t.isContentEditable)
      )
        return;
      const idx = ["1", "2", "3"].indexOf(e.key);
      if (idx < 0) return;
      e.preventDefault();
      setPending(idx);
      router.push(items[idx].href);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  if (pathIdx < 0) return null;

  return (
    <nav className="flex items-baseline justify-between gap-4">
      <div ref={wrapRef} className="relative blur-group flex gap-6 pb-1.5">
        {items.map((it, i) => {
          const active = i === activeIdx;
          return (
            <Link
              key={it.href}
              href={it.href}
              prefetch
              onClick={() => setPending(i)}
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
