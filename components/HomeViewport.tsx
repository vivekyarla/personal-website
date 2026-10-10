"use client";

import { useLayoutEffect } from "react";

// Hard-locks page scroll while the home page is mounted — the home screen is
// always stationary, no scrollbar. (CSS limits the lock to >=640px-wide
// viewports so phones still scroll rather than clipping content.)
//
// Because nothing can scroll, the page must also always fit: when the
// window is too short for the content, the whole site frame (column +
// footer) is zoomed down uniformly until it fits, and back up to 100% when
// there's room. Re-fits on resize, font load and content changes.
const MIN_ZOOM = 0.5;

export default function HomeViewport() {
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.add("home-locked");
    const frame = document.querySelector<HTMLElement>("[data-site-frame]");
    const locked = window.matchMedia("(min-width: 640px)");
    if (!frame) return () => root.classList.remove("home-locked");

    let raf = 0;
    const fit = () => {
      raf = 0;
      frame.style.zoom = "";
      if (!locked.matches) return;
      const avail = window.innerHeight;
      // Measure where the frame's last child (the footer) really ends — the
      // lock clips the page, so document scrollHeight just reports the
      // window. `zoom` reflows (vh-based spacing too), so refine a few times.
      const end = () =>
        (frame.lastElementChild ?? frame).getBoundingClientRect().bottom;
      let z = 1;
      for (let i = 0; i < 4; i++) {
        const h = end();
        if (h <= avail + 0.5) break;
        z = Math.max(MIN_ZOOM, z * (avail / h) * 0.995);
        frame.style.zoom = String(z);
        if (z === MIN_ZOOM) break;
      }
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(fit);
    };

    fit();
    document.fonts?.ready.then(schedule);
    window.addEventListener("resize", schedule);
    locked.addEventListener("change", schedule);
    // <html> is locked to the window height, so observing it catches any
    // viewport change (resize, fullscreen, browser zoom) even without a
    // resize event; <main> catches content changes.
    const ro = new ResizeObserver(schedule);
    ro.observe(root);
    const main = frame.querySelector("main");
    if (main) ro.observe(main);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("resize", schedule);
      locked.removeEventListener("change", schedule);
      ro.disconnect();
      frame.style.zoom = "";
      root.classList.remove("home-locked");
    };
  }, []);
  return null;
}
