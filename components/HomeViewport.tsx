"use client";

import { useEffect } from "react";

// Locks page scroll while the home page is mounted (CSS only kicks in on
// screens tall/wide enough to fit the content — see globals.css).
export default function HomeViewport() {
  useEffect(() => {
    document.documentElement.classList.add("home-locked");
    return () => document.documentElement.classList.remove("home-locked");
  }, []);
  return null;
}
