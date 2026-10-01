// Client-safe calendar types + local override resolution. Overrides live only
// in Supabase (`calendar_event_overrides`) — nothing is ever written back to
// Google Calendar.

export type CalEvent = {
  uid: string; // iCal UID — shared by every occurrence of a recurring series
  title: string; // original title from Google
  dateKey: string; // YYYY-MM-DD in PT
  timeLabel: string | null; // "07:00" (PT, 24h) — null for all-day
  startMs: number;
  endMs: number; // == startMs when the source gives no end
  location?: string | null; // as entered in Google (room, address or URL)
  allDay: boolean;
  recurring: boolean;
};

// date_key "" = applies to every occurrence; "YYYY-MM-DD" = that day only.
export type CalOverride = {
  uid: string;
  date_key: string;
  custom_title: string | null;
  hidden: boolean;
};

export type CalendarData = {
  events: Record<string, CalEvent[]>; // dateKey -> events, display order
  overrides: CalOverride[];
};

export type ShownEvent = CalEvent & {
  displayTitle: string;
  renamed: boolean;
  // Which override level hides it (day wins), or null if visible.
  hiddenBy: "day" | "series" | null;
  // Which level the current rename lives at, or null if not renamed.
  renamedAt: "day" | "series" | null;
};

// When an event is over (events with no end count as 30 minutes).
export function eventEndMs(e: Pick<CalEvent, "startMs" | "endMs">): number {
  return e.endMs > e.startMs ? e.endMs : e.startMs + 30 * 60 * 1000;
}

// Stable per-occurrence key — links Tasks-page events to the calendar view.
export function eventKey(e: Pick<CalEvent, "dateKey" | "uid" | "timeLabel">) {
  return `${e.dateKey}|${e.uid}|${e.timeLabel ?? "allday"}`;
}

const okey = (uid: string, dateKey: string) => `${uid}|${dateKey}`;

export function resolveEvents(
  events: CalEvent[],
  overrides: CalOverride[]
): ShownEvent[] {
  const byKey = new Map(overrides.map((o) => [okey(o.uid, o.date_key), o]));
  return events.map((e) => {
    const day = byKey.get(okey(e.uid, e.dateKey));
    const series = byKey.get(okey(e.uid, ""));
    const renamedAt = day?.custom_title
      ? "day"
      : series?.custom_title
        ? "series"
        : null;
    return {
      ...e,
      displayTitle: day?.custom_title || series?.custom_title || e.title,
      renamed: renamedAt !== null,
      renamedAt,
      hiddenBy: day?.hidden ? "day" : series?.hidden ? "series" : null,
    };
  });
}

// Merge a patch into the override list, dropping rows that end up empty.
export function patchOverrides(
  overrides: CalOverride[],
  uid: string,
  dateKey: string,
  patch: { custom_title?: string | null; hidden?: boolean }
): CalOverride[] {
  const existing = overrides.find(
    (o) => o.uid === uid && o.date_key === dateKey
  );
  const next: CalOverride = {
    uid,
    date_key: dateKey,
    custom_title: existing?.custom_title ?? null,
    hidden: existing?.hidden ?? false,
    ...patch,
  };
  const rest = overrides.filter(
    (o) => !(o.uid === uid && o.date_key === dateKey)
  );
  return next.custom_title || next.hidden ? [...rest, next] : rest;
}
