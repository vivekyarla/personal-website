"use client";

import { useEffect, useMemo, useState } from "react";
import {
  resolveEvents,
  type CalendarData,
  type ShownEvent,
} from "@/lib/calendar-overrides";
import { useCalendarPolling } from "@/components/admin/useCalendarPolling";

// Read-only Sun–Sat week grid of Google Calendar (PT). Blocks are sized by
// duration; overlapping events share the column side by side. Local
// renames/hides from the Tasks page apply here too.

const HOUR_PX = 44;
const MIN_BLOCK_MIN = 20; // shortest drawn block, in minutes
const DEFAULT_START_HOUR = 8;
const DEFAULT_END_HOUR = 20;

type Props = {
  today: string;
  initialWeekStart: string;
  initialCalendar: CalendarData;
  configured: boolean;
};

function addDays(iso: string, n: number): string {
  const d = new Date(iso + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function fmtDay(iso: string, opts: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", ...opts }).format(
    new Date(iso + "T12:00:00Z")
  );
}

// Minutes since midnight → "7:00" / "10:30" (12-hour, no am/pm).
function fmtClock(min: number): string {
  const h = Math.floor(min / 60) % 24;
  const m = Math.round(min % 60);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")}`;
}

function fmtHour(h: number): string {
  return `${h % 12 || 12} ${h < 12 || h === 24 ? "am" : "pm"}`;
}

const nowFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Los_Angeles",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

// Current PT date key + minutes since midnight.
function ptNow(): { dateKey: string; min: number } {
  const p = Object.fromEntries(
    nowFmt.formatToParts(new Date()).map((x) => [x.type, x.value])
  );
  return {
    dateKey: `${p.year}-${p.month}-${p.day}`,
    min: Number(p.hour) * 60 + Number(p.minute),
  };
}

type Placed = {
  e: ShownEvent;
  start: number; // minutes since midnight (PT)
  end: number;
  col: number;
  cols: number;
};

// Greedy column packing: events that (transitively) overlap form a cluster;
// each takes the first free column, and the whole cluster splits its width.
function layoutDay(events: ShownEvent[]): Placed[] {
  const items = events
    .map((e) => {
      const [h, m] = (e.timeLabel ?? "0:0").split(":").map(Number);
      const start = h * 60 + m;
      const dur = Math.max(0, (e.endMs - e.startMs) / 60000) || 30;
      return { e, start, end: Math.min(24 * 60, start + dur), col: 0, cols: 1 };
    })
    .sort((a, b) => a.start - b.start || b.end - a.end);

  const out: Placed[] = [];
  let cluster: Placed[] = [];
  let colEnds: number[] = [];
  let clusterEnd = -1;
  const flush = () => {
    for (const p of cluster) p.cols = colEnds.length;
    out.push(...cluster);
    cluster = [];
    colEnds = [];
  };
  for (const it of items) {
    const visEnd = Math.max(it.end, it.start + MIN_BLOCK_MIN);
    if (it.start >= clusterEnd) flush();
    let col = colEnds.findIndex((end) => end <= it.start);
    if (col < 0) col = colEnds.push(0) - 1;
    colEnds[col] = visEnd;
    it.col = col;
    cluster.push(it);
    clusterEnd = Math.max(clusterEnd, visEnd);
  }
  flush();
  return out;
}

export default function WeekCalendar({
  today,
  initialWeekStart,
  initialCalendar,
  configured,
}: Props) {
  const [weekStart, setWeekStart] = useState(initialWeekStart);
  const [navigated, setNavigated] = useState(false);
  const [weeks, setWeeks] = useState<Record<string, CalendarData>>({
    [initialWeekStart]: initialCalendar,
  });
  // Tapped/clicked event, shown in full above the grid (blocks truncate).
  const [selected, setSelected] = useState<{ key: string; label: string } | null>(
    null
  );
  // Client-only (avoids hydration drift); ticks each minute for the now line.
  const [now, setNow] = useState<{ dateKey: string; min: number } | null>(null);

  useEffect(() => {
    const tick = () => setNow(ptNow());
    const first = window.setTimeout(tick, 0);
    const id = window.setInterval(tick, 60 * 1000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, []);

  const dates = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  useCalendarPolling(
    configured,
    dates,
    () => {
      const ws = weekStart;
      return (fresh) => setWeeks((prev) => ({ ...prev, [ws]: fresh }));
    },
    navigated
  );

  function go(target: string) {
    setNavigated(true);
    setSelected(null);
    setWeekStart(target);
  }

  // ←/→ change week, t jumps back to this week (ignored while typing).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.tagName === "SELECT" ||
          t.isContentEditable)
      )
        return;
      if (e.key === "ArrowLeft") go(addDays(weekStart, -7));
      else if (e.key === "ArrowRight") go(addDays(weekStart, 7));
      else if (e.key === "t") go(initialWeekStart);
      else return;
      e.preventDefault();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [weekStart, initialWeekStart]);

  const data = weeks[weekStart];
  const days = useMemo(
    () =>
      dates.map((d) => {
        const shown = resolveEvents(
          data?.events[d] ?? [],
          data?.overrides ?? []
        ).filter((e) => !e.hiddenBy);
        return {
          date: d,
          allDay: shown.filter((e) => e.allDay),
          timed: layoutDay(shown.filter((e) => !e.allDay)),
        };
      }),
    [dates, data]
  );

  // Visible hours: 8am–8pm, stretched to fit the week's earliest/latest event.
  const timed = days.flatMap((d) => d.timed);
  const startHour = Math.min(
    DEFAULT_START_HOUR,
    ...timed.map((p) => Math.floor(p.start / 60))
  );
  const endHour = Math.max(
    DEFAULT_END_HOUR,
    ...timed.map((p) => Math.ceil(Math.max(p.end, p.start + MIN_BLOCK_MIN) / 60))
  );
  const hours = Array.from(
    { length: endHour - startHour },
    (_, i) => startHour + i
  );
  const gridMin = startHour * 60;
  const hasAllDay = days.some((d) => d.allDay.length > 0);
  const cols = "grid grid-cols-[2.25rem_repeat(7,minmax(0,1fr))] sm:grid-cols-[3rem_repeat(7,minmax(0,1fr))]";

  const rangeLabel = `${fmtDay(dates[0], { month: "short", day: "numeric" })} – ${fmtDay(
    dates[6],
    fmtDay(dates[0], { month: "short" }) === fmtDay(dates[6], { month: "short" })
      ? { day: "numeric" }
      : { month: "short", day: "numeric" }
  )}`;
  const isThisWeek = weekStart === initialWeekStart;

  const navBtn =
    "px-1 text-muted hover:text-foreground transition-colors disabled:opacity-40";

  return (
    <>
      <div className="flex items-baseline justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Calendar</h1>
        <div className="flex items-baseline gap-2 text-[0.72rem] text-muted/80 tabular-nums">
          {!data && <span className="text-muted/50">loading…</span>}
          <span className="text-foreground/80">{rangeLabel}</span>
          <button
            type="button"
            onClick={() => go(addDays(weekStart, -7))}
            aria-label="Previous week"
            className={navBtn}
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => go(initialWeekStart)}
            disabled={isThisWeek}
            className={navBtn}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => go(addDays(weekStart, 7))}
            aria-label="Next week"
            className={navBtn}
          >
            ›
          </button>
        </div>
      </div>

      <p
        aria-live="polite"
        className={`-mt-3 min-h-[1.1rem] truncate text-[0.78rem] transition-opacity ${
          selected ? "opacity-100" : "opacity-0"
        }`}
      >
        {selected?.label}
      </p>

      {!configured && (
        <p className="text-[0.8rem] text-muted/80 italic">
          Calendar not connected — set GCAL_ICS_URLS to see events here.
        </p>
      )}

      <div className="writing-bleed">
        {/* Day headers */}
        <div className={`${cols} pb-2`}>
          <div />
          {dates.map((d) => {
            const isToday = d === today;
            return (
              <div key={d} className="flex flex-col items-center gap-1">
                <span className="text-[0.6rem] uppercase tracking-wide text-muted/80">
                  {fmtDay(d, { weekday: "short" })}
                </span>
                <span
                  className={`flex size-6 items-center justify-center rounded-full text-[0.8rem] tabular-nums ${
                    isToday
                      ? "bg-foreground text-background font-medium"
                      : d < today
                        ? "text-muted"
                        : "text-foreground"
                  }`}
                >
                  {Number(d.slice(8))}
                </span>
              </div>
            );
          })}
        </div>

        {/* All-day strip */}
        {hasAllDay && (
          <div className={`${cols} border-t border-rule py-1`}>
            <div className="self-center text-[0.55rem] uppercase tracking-tight text-muted/70">
              All day
            </div>
            {days.map((d) => (
              <div key={d.date} className="flex min-w-0 flex-col gap-0.5 px-px">
                {d.allDay.map((e) => (
                  <div
                    key={e.uid}
                    title={e.displayTitle}
                    className="truncate rounded-[3px] bg-foreground/[0.07] px-1 py-0.5 text-[0.62rem] leading-tight text-foreground/85"
                  >
                    {e.displayTitle}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Time grid */}
        <div
          className={`${cols} relative border-t border-rule`}
          style={{ height: hours.length * HOUR_PX }}
        >
          {/* Hour labels */}
          <div className="relative">
            {hours.slice(1).map((h, i) => (
              <span
                key={h}
                className="absolute right-1.5 -translate-y-1/2 text-[0.55rem] uppercase tracking-tight text-muted/70 tabular-nums sm:right-2 sm:text-[0.6rem]"
                style={{ top: (i + 1) * HOUR_PX }}
              >
                {fmtHour(h)}
              </span>
            ))}
          </div>

          {days.map((d) => {
            const isToday = d.date === today;
            const nowMin = now && now.dateKey === d.date ? now.min : null;
            return (
              <div key={d.date} className="relative border-l border-rule">
                {/* Hour lines */}
                {hours.slice(1).map((h, i) => (
                  <div
                    key={h}
                    aria-hidden
                    className="absolute inset-x-0 border-t border-rule/60"
                    style={{ top: (i + 1) * HOUR_PX }}
                  />
                ))}

                {d.timed.map((p) => {
                  const top = ((p.start - gridMin) / 60) * HOUR_PX;
                  const height = Math.max(
                    ((p.end - p.start) / 60) * HOUR_PX,
                    (MIN_BLOCK_MIN / 60) * HOUR_PX
                  );
                  const range = `${fmtClock(p.start)} – ${fmtClock(p.end)}`;
                  const past =
                    now !== null &&
                    (d.date < now.dateKey ||
                      (d.date === now.dateKey && p.end <= now.min));
                  const roomy = height >= 30;
                  const key = `${d.date}|${p.e.uid}|${p.start}`;
                  const isSelected = selected?.key === key;
                  return (
                    <button
                      type="button"
                      key={key}
                      title={`${p.e.displayTitle}\n${range}`}
                      onClick={() =>
                        setSelected(
                          isSelected
                            ? null
                            : {
                                key,
                                label: `${p.e.displayTitle} · ${fmtDay(d.date, {
                                  weekday: "short",
                                })} ${range}`,
                              }
                        )
                      }
                      className={`absolute overflow-hidden rounded-[3px] border-l-2 px-0.5 text-left transition-[background-color,opacity] hover:z-10 sm:px-1 ${
                        isSelected
                          ? "z-10 border-foreground bg-foreground/[0.16]"
                          : "border-foreground/45 bg-foreground/[0.07] hover:bg-foreground/[0.13]"
                      } ${roomy ? "flex flex-col justify-start py-0.5" : "flex items-center"} ${
                        past && !isSelected ? "opacity-45" : ""
                      }`}
                      style={{
                        top: top + 1,
                        height: height - 2,
                        left: `calc(${(p.col / p.cols) * 100}% + 2px)`,
                        width: `calc(${100 / p.cols}% - 3px)`,
                      }}
                    >
                      {roomy ? (
                        <>
                          {/* Whole words only — narrow (phone) columns clip
                              rather than splitting "CS229" mid-word. */}
                          <div className="text-[0.6rem] font-medium leading-tight text-foreground/90 [overflow-wrap:normal] sm:text-[0.68rem]">
                            {p.e.displayTitle}
                          </div>
                          <div className="mt-px whitespace-nowrap text-[0.56rem] leading-tight text-muted tabular-nums sm:text-[0.6rem]">
                            <span className="sm:hidden">{fmtClock(p.start)}</span>
                            <span className="hidden sm:inline">{range}</span>
                          </div>
                        </>
                      ) : (
                        <div className="truncate text-[0.58rem] leading-none text-foreground/90 sm:text-[0.64rem]">
                          <span className="font-medium">{p.e.displayTitle}</span>
                          <span className="ml-1 text-muted tabular-nums">
                            {fmtClock(p.start)}
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}

                {/* Now line */}
                {isToday &&
                  nowMin !== null &&
                  nowMin >= gridMin &&
                  nowMin <= endHour * 60 && (
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-x-0 z-20 h-px bg-red-500"
                      style={{ top: ((nowMin - gridMin) / 60) * HOUR_PX }}
                    >
                      <span className="absolute -left-1 -top-[3px] size-[7px] rounded-full bg-red-500" />
                    </div>
                  )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
