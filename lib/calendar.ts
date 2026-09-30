import "server-only";
import ical, { type CalendarResponse } from "node-ical";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  calendarIdFromIcsUrl,
  googleApiConfigured,
  listEvents,
  type GcalItem,
} from "@/lib/google-calendar";
import type {
  CalEvent,
  CalendarData,
  CalOverride,
} from "@/lib/calendar-overrides";

export type { CalEvent, CalendarData, CalOverride };

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

type Window = { wanted: Set<string>; start: Date; end: Date; key: string };

function windowFor(dateKeys: string[]): Window {
  // From start of first day to end of last, padded a day on each side so
  // PT/UTC boundary events aren't missed.
  const sorted = [...dateKeys].sort();
  const start = new Date(sorted[0] + "T00:00:00Z");
  start.setUTCDate(start.getUTCDate() - 1);
  const end = new Date(sorted[sorted.length - 1] + "T00:00:00Z");
  end.setUTCDate(end.getUTCDate() + 2);
  return { wanted: new Set(dateKeys), start, end, key: sorted.join(",") };
}

/* ---------- Google Calendar API source (fresh, preferred) ---------- */

function fromApi(items: GcalItem[], win: Window): CalEvent[] {
  const out: CalEvent[] = [];
  for (const it of items) {
    const base = {
      uid: it.iCalUID ?? it.id,
      title: it.summary ?? "(untitled)",
      location: it.location?.trim() || null,
      recurring: !!it.recurringEventId,
    };
    if (it.start?.date) {
      // All-day: end.date is exclusive. Show on every wanted day it covers.
      const startKey = it.start.date;
      const endKey = it.end?.date ?? startKey;
      for (const d of win.wanted) {
        if (d >= startKey && (d < endKey || d === startKey)) {
          out.push({
            ...base,
            dateKey: d,
            timeLabel: null,
            startMs: Date.parse(d + "T00:00:00Z"),
            endMs: Date.parse(d + "T00:00:00Z"),
            allDay: true,
          });
        }
      }
    } else if (it.start?.dateTime) {
      const start = new Date(it.start.dateTime);
      const dateKey = ptDateKey(start);
      if (!win.wanted.has(dateKey)) continue;
      const end = it.end?.dateTime ? Date.parse(it.end.dateTime) : NaN;
      out.push({
        ...base,
        dateKey,
        timeLabel: ptTimeLabel(start),
        startMs: start.getTime(),
        endMs: Number.isNaN(end) ? start.getTime() : end,
        allDay: false,
      });
    }
  }
  return out;
}

/* ---------- iCal feed source (fallback; Google's feed can lag) ---------- */

// node-ical text props are a string or { val, params }.
function icsText(v: unknown): string | null {
  const s = typeof v === "string" ? v : (v as { val?: unknown } | null)?.val;
  return typeof s === "string" && s.trim() ? s.trim() : null;
}

function fromIcs(parsed: CalendarResponse, win: Window): CalEvent[] {
  const events: CalEvent[] = [];
  for (const ev of Object.values(parsed)) {
    try {
      if (!ev || ev.type !== "VEVENT") continue;
      const summary = String(ev.summary ?? "(untitled)");
      const isAllDay =
        (ev.datetype as string | undefined) === "date" ||
        (ev.start as unknown as { dateOnly?: boolean })?.dateOnly === true;

      const keyOf = (d: Date) => (isAllDay ? localDateKey(d) : ptDateKey(d));
      const uid = String(ev.uid ?? summary);
      const recurring = !!ev.rrule;
      const durationOf = (e: typeof ev) =>
        e.end && e.start
          ? Math.max(0, (e.end as Date).getTime() - (e.start as Date).getTime())
          : 0;
      const baseDuration = durationOf(ev);
      const baseLocation = icsText(ev.location);

      const pushOccurrence = (
        start: Date,
        title: string,
        duration = baseDuration,
        location = baseLocation
      ) => {
        const dateKey = keyOf(start);
        if (!win.wanted.has(dateKey)) return;
        events.push({
          uid,
          title,
          dateKey,
          timeLabel: isAllDay ? null : ptTimeLabel(start),
          startMs: start.getTime(),
          endMs: start.getTime() + duration,
          location,
          allDay: isAllDay,
          recurring,
        });
      };

      if (ev.rrule) {
        // node-ical wraps rrule-temporal: between() already returns
        // timezone-correct instants (DST handled). No correction needed.
        const occurrences = ev.rrule.between(win.start, win.end, true);
        const exdates = new Set(
          Object.values(ev.exdate ?? {}).map((d) => keyOf(d as Date))
        );
        for (const occ of occurrences) {
          if (exdates.has(keyOf(occ))) continue;
          pushOccurrence(occ, summary);
        }
        // Modified single occurrences (moved/renamed instances)
        for (const rec of Object.values(ev.recurrences ?? {})) {
          const r = rec as typeof ev;
          pushOccurrence(
            r.start as Date,
            String(r.summary ?? summary),
            durationOf(r),
            icsText(r.location) ?? baseLocation
          );
        }
      } else {
        pushOccurrence(ev.start as Date, summary);
      }
    } catch (err) {
      console.error("[calendar] event parse:", err);
    }
  }
  return events;
}

/* ---------- Per-calendar fetch with short-lived cache ---------- */

// The API is fast and fresh, so it's cached only long enough to dedupe
// polling tabs. iCal downloads are slow (and lag on Google's side anyway).
const API_TTL_MS = 10 * 1000;
const ICS_TTL_MS = 60 * 1000;
// Entries are kept past expiry as a last-known-good fallback, so a flaky
// fetch never makes events blink out between polls.
const cache = new Map<string, { exp: number; events: CalEvent[] }>();

async function cached(
  key: string,
  ttl: number,
  load: () => Promise<CalEvent[]>
): Promise<CalEvent[] | null> {
  const hit = cache.get(key);
  if (hit && hit.exp > Date.now()) return hit.events;
  try {
    const events = await load();
    cache.set(key, { exp: Date.now() + ttl, events });
    return events;
  } catch (err) {
    console.error("[calendar]", key.split("|")[1], err);
    return hit?.events ?? null;
  }
}

async function fetchSource(url: string, win: Window): Promise<CalEvent[]> {
  const calId = googleApiConfigured() ? calendarIdFromIcsUrl(url) : null;
  if (calId) {
    const viaApi = await cached(`api|${calId}|${win.key}`, API_TTL_MS, async () =>
      fromApi(await listEvents(calId, win.start, win.end), win)
    );
    if (viaApi) return viaApi;
  }
  const viaIcs = await cached(`ics|${url}|${win.key}`, ICS_TTL_MS, async () =>
    fromIcs(await ical.async.fromURL(url), win)
  );
  return viaIcs ?? [];
}

function calendarUrls(): string[] {
  return (process.env.GCAL_ICS_URLS ?? "")
    .split(",")
    .map((u) => u.trim())
    .filter(Boolean);
}

async function fetchOverrides(dateKeys: string[]): Promise<CalOverride[]> {
  // Tiny table — filter here rather than fight PostgREST over "" in in().
  const { data, error } = await supabaseAdmin
    .from("calendar_event_overrides")
    .select("uid, date_key, custom_title, hidden");
  if (error) console.error("[calendar] overrides:", error.message);
  const wanted = new Set(["", ...dateKeys]);
  return ((data ?? []) as CalOverride[]).filter((o) => wanted.has(o.date_key));
}

// Raw events bucketed per date key (all-day first, then by time) plus the
// local overrides that apply to them. Overrides are resolved client-side so
// renames/hides can update optimistically.
export async function fetchCalendar(dateKeys: string[]): Promise<CalendarData> {
  const events: Record<string, CalEvent[]> = {};
  for (const k of dateKeys) events[k] = [];
  const urls = calendarUrls();
  if (dateKeys.length === 0 || urls.length === 0) return { events, overrides: [] };

  const win = windowFor(dateKeys);
  // All calendars in parallel; a failing feed never blocks the rest.
  const [lists, overrides] = await Promise.all([
    Promise.all(urls.map((u) => fetchSource(u, win))),
    fetchOverrides(dateKeys),
  ]);

  // Dedupe (recurrence overrides can duplicate the expanded base; the same
  // calendar may be subscribed twice) + bucket
  const seen = new Set<string>();
  for (const e of lists.flat().sort((a, b) => a.startMs - b.startMs)) {
    const key = `${e.uid}|${e.dateKey}|${e.timeLabel ?? "allday"}`;
    if (seen.has(key)) continue;
    seen.add(key);
    events[e.dateKey]?.push(e);
  }
  for (const k of dateKeys) {
    events[k].sort((a, b) =>
      a.allDay === b.allDay ? a.startMs - b.startMs : a.allDay ? -1 : 1
    );
  }
  return { events, overrides };
}

export function calendarConfigured(): boolean {
  return calendarUrls().length > 0;
}
