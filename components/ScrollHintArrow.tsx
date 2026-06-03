"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  children: React.ReactNode;
  className?: string;
  maxHeight?: string; // e.g. "40vh"
  hideWhenEmpty?: boolean;
};

// Wraps a scrollable container and renders a small ↓ that flips to ↑
// when the user has reached the bottom.
export default function ScrollableSection({
  children,
  className = "",
  maxHeight = "40vh",
  hideWhenEmpty = true,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [atBottom, setAtBottom] = useState(false);
  const [scrollable, setScrollable] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function check() {
      if (!el) return;
      const canScroll = el.scrollHeight - el.clientHeight > 2;
      setScrollable(canScroll);
      const reached =
        el.scrollHeight - el.scrollTop - el.clientHeight < 2;
      setAtBottom(reached);
    }
    check();
    el.addEventListener("scroll", check, { passive: true });
    const resizeObs = new ResizeObserver(check);
    resizeObs.observe(el);
    return () => {
      el.removeEventListener("scroll", check);
      resizeObs.disconnect();
    };
  }, []);

  return (
    <>
      <div
        ref={ref}
        className={`overflow-y-auto scrollbar-hidden ${className}`}
        style={{ maxHeight }}
      >
        {children}
      </div>
      {(!hideWhenEmpty || scrollable) && (
        <div
          aria-hidden
          className="text-center text-muted/60 text-sm mt-1 leading-none select-none"
        >
          <span
            className={`inline-block transition-transform duration-300 ease-out ${
              atBottom ? "rotate-180" : "rotate-0"
            }`}
          >
            ↓
          </span>
        </div>
      )}
    </>
  );
}
