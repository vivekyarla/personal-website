"use client";

import { useEffect, type RefObject } from "react";

// Class-driven spotlight for vertical lists (same technique as the tweet
// carousels): :hover freezes during scroll, so we track the pointer and
// recompute the row under it on every pointer move AND every page-scroll
// frame. Attach to a container that has `tweet-spot-group`; rows carry
// `tweet-spot-item`.
export function useScrollSpotlight(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const group = ref.current;
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
  }, [ref]);
}
