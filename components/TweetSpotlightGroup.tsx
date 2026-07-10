"use client";

import { useEffect, useRef } from "react";

// Class-driven spotlight for tweet carousels. CSS :hover freezes during
// scrolling (browsers only re-evaluate hover on pointer moves), so a
// stationary cursor + horizontal scroll wouldn't hand the spotlight off.
// Instead we track the pointer and recompute the tweet under it via
// elementFromPoint on every pointer move AND every scroll frame.
export default function TweetSpotlightGroup({
  children,
}: {
  children: React.ReactNode;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<HTMLDivElement>(null);
  const pointer = useRef<{ x: number; y: number } | null>(null);
  const raf = useRef(0);

  useEffect(() => {
    const scroller = scrollerRef.current;
    const group = groupRef.current;
    if (!scroller || !group) return;

    function paint() {
      raf.current = 0;
      if (!group) return;
      const p = pointer.current;
      let active: Element | null = null;
      if (p) {
        const el = document.elementFromPoint(p.x, p.y);
        const item = el?.closest(".tweet-spot-item");
        if (item && group.contains(item)) active = item;
      }
      group
        .querySelectorAll(".tweet-spot-item")
        .forEach((it) => it.classList.toggle("tw-active", it === active));
      group.classList.toggle("tw-spot", !!active);
    }
    function schedule() {
      if (!raf.current) raf.current = requestAnimationFrame(paint);
    }
    function onMove(e: PointerEvent) {
      if (e.pointerType !== "mouse") return; // touch scrolls shouldn't spotlight
      pointer.current = { x: e.clientX, y: e.clientY };
      schedule();
    }
    function onLeave() {
      pointer.current = null;
      schedule();
    }

    scroller.addEventListener("pointermove", onMove);
    scroller.addEventListener("pointerleave", onLeave);
    scroller.addEventListener("scroll", schedule, { passive: true });
    return () => {
      scroller.removeEventListener("pointermove", onMove);
      scroller.removeEventListener("pointerleave", onLeave);
      scroller.removeEventListener("scroll", schedule);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <div
      ref={scrollerRef}
      className="overflow-x-auto snap-x snap-mandatory scrollbar-hidden touch-pan-x"
    >
      <div ref={groupRef} className="tweet-spot-group flex items-start pb-2 px-6">
        {children}
      </div>
    </div>
  );
}
