"use client";

import { useEffect, useRef } from "react";
import type { CalendarData } from "@/lib/calendar-overrides";

// How often an open calendar view re-pulls Google Calendar (also on tab focus).
export const CAL_POLL_MS = 20 * 1000;

// Re-fetch /api/calendar for `dates` while the tab is visible, and right away
// on returning to it, so edits made in Google Calendar land within seconds.
// `begin` runs as each request starts and returns the handler for its result
// — letting callers capture state at request time (e.g. to ignore a poll that
// raced a local edit). `immediate` also fetches as soon as `dates` changes.
export function useCalendarPolling(
  enabled: boolean,
  dates: string[],
  begin: () => (fresh: CalendarData) => void,
  immediate = false
) {
  const beginRef = useRef(begin);
  useEffect(() => {
    beginRef.current = begin;
  });
  const datesKey = dates.join(",");

  useEffect(() => {
    if (!enabled || !datesKey) return;
    let inFlight = false;
    let cancelled = false;
    async function refresh() {
      if (inFlight || document.visibilityState !== "visible") return;
      inFlight = true;
      const done = beginRef.current();
      try {
        const res = await fetch(`/api/calendar?dates=${datesKey}`, {
          cache: "no-store",
        });
        if (res.ok && !cancelled) done((await res.json()) as CalendarData);
      } catch {
        // Offline / transient — keep what's on screen.
      } finally {
        inFlight = false;
      }
    }
    if (immediate) refresh();
    const id = setInterval(refresh, CAL_POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      cancelled = true;
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [enabled, datesKey, immediate]);
}
