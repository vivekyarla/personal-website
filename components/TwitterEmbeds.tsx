"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    twttr?: { widgets: { load: (el?: HTMLElement) => void } };
  }
}

// Loads Twitter's widget script once and re-binds tweets on navigation /
// content changes. Place once near the tweet grids.
export default function TwitterEmbeds() {
  useEffect(() => {
    const SRC = "https://platform.twitter.com/widgets.js";
    if (!document.querySelector(`script[src="${SRC}"]`)) {
      const s = document.createElement("script");
      s.src = SRC;
      s.async = true;
      s.charset = "utf-8";
      document.body.appendChild(s);
    } else if (window.twttr?.widgets) {
      window.twttr.widgets.load();
    }
  });
  return null;
}
