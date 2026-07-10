"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    __applySunTheme?: (lat: number, lon: number) => void;
  }
}

// After load: fetch the visitor's approximate coordinates (Vercel IP geo),
// cache them for instant pre-paint accuracy on future visits, and re-run the
// sunset check. Skipped entirely if the user manually toggled the theme.
export default function GeoTheme() {
  useEffect(() => {
    try {
      if (sessionStorage.getItem("themeOverride")) return;
    } catch {}
    fetch("/api/geo")
      .then((r) => r.json())
      .then((g: { lat: number | null; lon: number | null }) => {
        if (
          g &&
          typeof g.lat === "number" &&
          typeof g.lon === "number" &&
          isFinite(g.lat) &&
          isFinite(g.lon)
        ) {
          try {
            localStorage.setItem("geo", JSON.stringify({ lat: g.lat, lon: g.lon }));
          } catch {}
          window.__applySunTheme?.(g.lat, g.lon);
        }
      })
      .catch(() => {});
  }, []);
  return null;
}
