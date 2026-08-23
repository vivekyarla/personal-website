import "server-only";
import ical from "node-ical";
import { supabaseAdmin } from "@/lib/supabase-admin";

export type CalEvent = {
  uid: string;
  title: string; // display title (override applied)
  originalTitle: string;
  dateKey: string; // YYYY-MM-DD in PT
  timeLabel: string | null; // "07:00" (PT, 24h) — null for all-day
  startMs: number;
  allDay: boolean;
};

const TZ = "America/Los_Angeles";

function ptDateKey(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function ptTimeLabel(d: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

// Date key for all-day (VALUE=DATE) dates — node-ical hands these back as
// local-midnight Dates, so read local components, not UTC/PT.
function localDateKey(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// Feed expansion is the slow part (7 ICS downloads) — cache it in-module for
// 5 minutes. Overrides are applied fresh on every request so renames show
// instantly.
const CAL_TTL_MS = 5 * 60 * 1000;
let calCache: { key: string; exp: number; events: CalEvent[] } | null = null;

// Fetch + expand all configured calendars into a flat event list (no
// overrides applied).
async function expandAll(dateKeys: string[]): Promise<CalEvent[]> {
  const urls = (process.env.GCAL_ICS_URLS ?? "")
    .split(",")
    .map((u) => u.trim())
    .filter(Boolean);
  if (urls.length === 0 || dateKeys.length === 0) return [];

  const wanted = new Set(dateKeys);
  // Expansion window: from start of first day to end of last, padded a day on
  // each side so PT/UTC boundary events aren't missed.
  const sorted = [...dateKeys].sort();
  const winStart = new Date(sorted[0] + "T00:00:00Z");
  winStart.setUTCDate(winStart.getUTCDate() - 1);
  const winEnd = new Date(sorted[sorted.length - 1] + "T00:00:00Z");
  winEnd.setUTCDate(winEnd.getUTCDate() + 2);

  const events: CalEvent[] = [];

  // Fetch all calendars in parallel; a failing feed never blocks the rest.
  const parsedAll = await Promise.all(
    urls.map((url) =>
      ical.async.fromURL(url).catch((err) => {
        console.error("[calendar] fetch failed:", err);
        return null;
      })
    )
  );

  for (const parsed of parsedAll) {
    if (!parsed) continue;
    for (const ev of Object.values(parsed)) {
      try {
        if (!ev || ev.type !== "VEVENT") continue;
        const summary = String(ev.summary ?? "(untitled)");
        const isAllDay =
          (ev.datetype as string | undefined) === "date" ||
          (ev.start as unknown as { dateOnly?: boolean })?.dateOnly === true;

        const keyOf = (d: Date) => (isAllDay ? localDateKey(d) : ptDateKey(d));

        const pushOccurrence = (start: Date, title: string, uid: string) => {
          const dateKey = keyOf(start);
          if (!wanted.has(dateKey)) return;
          events.push({
            uid,
            title,
            originalTitle: title,
            dateKey,
            timeLabel: isAllDay ? null : ptTimeLabel(start),
            startMs: start.getTime(),
            allDay: isAllDay,
          });
        };

        const uid = String(ev.uid ?? summary);

        if (ev.rrule) {
          // node-ical wraps rrule-temporal: between() already returns
          // timezone-correct instants (DST handled). No correction needed.
          const occurrences = ev.rrule.between(winStart, winEnd, true);
          const exdates = new Set(
            Object.values(ev.exdate ?? {}).map((d) => keyOf(d as Date))
          );
          for (const occ of occurrences) {
            if (exdates.has(keyOf(occ))) continue;
            pushOccurrence(occ, summary, uid);
          }
          // Modified single occurrences (moved/renamed instances)
          for (const rec of Object.values(ev.recurrences ?? {})) {
            const r = rec as typeof ev;
            pushOccurrence(
              r.start as Date,
              String(r.summary ?? summary),
              uid
            );
          }
        } else {
          pushOccurrence(ev.start as Date, summary, uid);
        }
      } catch (err) {
        console.error("[calendar] event parse:", err);
      }
    }
  }
  return events;
}

// Expand events (cached) + apply local renames + bucket per date key.
// Returns { dateKey -> events sorted all-day-first-then-time }.
export async function fetchCalendarEvents(
  dateKeys: string[]
): Promise<Record<string, CalEvent[]>> {
  const out: Record<string, CalEvent[]> = {};
  for (const k of dateKeys) out[k] = [];
  if (dateKeys.length === 0) return out;

  const cacheKey = [...dateKeys].sort().join(",");
  let raw: CalEvent[];
  if (calCache && calCache.key === cacheKey && calCache.exp > Date.now()) {
    raw = calCache.events;
  } else {
    raw = await expandAll(dateKeys);
    calCache = { key: cacheKey, exp: Date.now() + CAL_TTL_MS, events: raw };
  }
  // Copy before mutating titles so the cache keeps originals.
  const events = raw.map((e) => ({ ...e }));

  // Apply local rename overrides (always fresh)
  const { data: overrides } = await supabaseAdmin
    .from("calendar_overrides")
    .select("uid, custom_title");
  const byUid = new Map(
    (overrides ?? []).map((o) => [o.uid as string, o.custom_title as string])
  );
  for (const e of events) {
    const custom = byUid.get(e.uid);
    if (custom) e.title = custom;
  }

  // Dedupe (recurrence overrides can duplicate the expanded base) + bucket
  const seen = new Set<string>();
  for (const e of events.sort((a, b) => a.startMs - b.startMs)) {
    const key = `${e.uid}|${e.dateKey}|${e.timeLabel ?? "allday"}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out[e.dateKey]?.push(e);
  }
  for (const k of dateKeys) {
    out[k].sort((a, b) =>
      a.allDay === b.allDay ? a.startMs - b.startMs : a.allDay ? -1 : 1
    );
  }
  return out;
}

export function calendarConfigured(): boolean {
  return ((process.env.GCAL_ICS_URLS ?? "").trim().length ?? 0) > 0;
}
