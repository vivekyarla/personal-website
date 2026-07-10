"use client";

import { useEffect } from "react";

// Hard-locks page scroll while the home page is mounted — the home screen is
// always stationary, no scrollbar. (CSS limits the lock to >=640px-wide
// viewports so phones still scroll rather than clipping content.)
export default function HomeViewport() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("home-locked");
    return () => root.classList.remove("home-locked");
  }, []);
  return null;
}
