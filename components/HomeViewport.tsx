"use client";

import { useEffect } from "react";

// Locks page scroll while the home page is mounted — but only when the full
// content (including footer) actually fits in the viewport. If it doesn't,
// the page scrolls normally so nothing gets clipped. Re-checked on resize
// and on content-height changes (fonts, theme, etc.).
export default function HomeViewport() {
  useEffect(() => {
    const root = document.documentElement;
    function update() {
      const fits = document.body.scrollHeight <= window.innerHeight + 1;
      root.classList.toggle("home-locked", fits);
    }
    update();
    window.addEventListener("resize", update);
    const ro = new ResizeObserver(update);
    ro.observe(document.body);
    return () => {
      root.classList.remove("home-locked");
      window.removeEventListener("resize", update);
      ro.disconnect();
    };
  }, []);
  return null;
}
