"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  resolveEvents,
  type CalEvent,
  type CalendarData,
  type CalOverride,
  type ShownEvent,
} from "@/lib/calendar-overrides";
import { useCalendarPolling } from "@/components/admin/useCalendarPolling";

// Read-only day strip of Google Calendar (PT): 5 days across (3 on phones),
// starting today. It's a native horizontal scroller with day snap points and
// the tweet carousel's edge fog, so trackpad/swipe glide and snap, and the
// arrows glide a page at a time. Days load as they come into view. Events are
// hairline rails sized by duration; local renames/hides from Tasks apply.

const HOUR_PX = 44;
const HEADER_PX = 44;
const ALLDAY_ROW_PX = 16;
const MIN_BLOCK_MIN = 20; // shortest drawn block, in minutes
const DEFAULT_START_HOUR = 8;
const DEFAULT_END_HOUR = 20;
const EXTEND_DAYS = 28; // days added when scrolling near either end

type Props = {
  today: string;
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

const range = (start: string, n: number) =>
  Array.from({ length: n }, (_, i) => addDays(start, i));

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// 5 days across from the `sm` breakpoint up, 3 on phones (matches the
// auto-cols widths below).
const WIDE_MQ = "(min-width: 640px)";
function subscribeWide(cb: () => void) {
  const mq = window.matchMedia(WIDE_MQ);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
const noopSubscribe = () => () => {};

// Exact (fractional) column width — columns are 20%/33.3% of the strip, so
// offsetWidth's rounding would drift a pixel per day.
function colWidth(scroller: HTMLElement | null): number {
  const el = scroller?.querySelector<HTMLElement>("[data-day]");
  return el?.getBoundingClientRect().width || 1;
}

export default function CalendarStrip({
  today,
  initialCalendar,
  configured,
}: Props) {
  // Rendered window of days (extends as you scroll toward either end).
  const [span, setSpan] = useState({
    start: addDays(today, -EXTEND_DAYS),
    len: EXTEND_DAYS * 3,
  });
  const days = useMemo(() => range(span.start, span.len), [span]);
  const todayIdx = days.indexOf(today);

  // Index of the leftmost visible day, and how many fit across.
  const [first, setFirst] = useState(todayIdx);
  const wide = useSyncExternalStore(
    subscribeWide,
    () => window.matchMedia(WIDE_MQ).matches,
    () => true
  );
  const perView = wide ? 5 : 3;
  // False during SSR/hydration: the strip stays invisible until it has been
  // scrolled to today, so it never flashes the days before.
  const ready = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );

  const [byDate, setByDate] = useState<Record<string, CalEvent[]>>(
    initialCalendar.events
  );
  const [overrides, setOverrides] = useState<CalOverride[]>(
    initialCalendar.overrides
  );
  const requested = useRef(new Set(Object.keys(initialCalendar.events)));

  // Tapped/clicked event, shown in full above the grid (blocks truncate).
  const [selected, setSelected] = useState<{ key: string; label: string } | null>(
    null
  );
  // Client-only (avoids hydration drift); ticks each minute for the now line.
  const [now, setNow] = useState<{ dateKey: string; min: number } | null>(null);

  const scrollerRef = useRef<HTMLDivElement>(null);
  // Edge fog shows only while the strip moves — at rest, columns sit flush
  // with the edges and the fog would veil the first/last day.
  const [moving, setMoving] = useState(false);
  const movingRef = useRef(false);
  const pendingShift = useRef(0); // columns prepended since last layout

  useEffect(() => {
    const tick = () => setNow(ptNow());
    const firstTick = window.setTimeout(tick, 0);
    const id = window.setInterval(tick, 60 * 1000);
    return () => {
      window.clearTimeout(firstTick);
      window.clearInterval(id);
    };
  }, []);

  /* ---- Data: merge responses per date; lazily load days near the view ---- */

  const merge = useCallback((fresh: CalendarData) => {
    const dates = new Set(Object.keys(fresh.events));
    setByDate((prev) => ({ ...prev, ...fresh.events }));
    // Series-level rows come back whole; keep day rows for other dates.
    setOverrides((prev) => [
      ...prev.filter((o) => o.date_key !== "" && !dates.has(o.date_key)),
      ...fresh.overrides,
    ]);
  }, []);

  const load = useCallback(
    async (dates: string[]) => {
      if (!configured) return;
      const need = dates.filter((d) => !requested.current.has(d));
      for (let i = 0; i < need.length; i += 7) {
        const chunk = need.slice(i, i + 7);
        chunk.forEach((d) => requested.current.add(d));
        fetch(`/api/calendar?dates=${chunk.join(",")}`, { cache: "no-store" })
          .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
          .then(merge)
          .catch(() => chunk.forEach((d) => requested.current.delete(d)));
      }
    },
    [configured, merge]
  );

  // Poll whatever is on screen (plus a day either side) for live edits.
  const pollDates = useMemo(
    () => (ready ? range(addDays(days[first] ?? today, -1), 7) : []),
    [ready, days, first, today]
  );
  useCalendarPolling(configured, pollDates, () => merge, first !== todayIdx);

  /* ---- Scroll geometry ---- */

  // Start with today as the first column (set on mount, before paint).
  const initialIdx = useRef(todayIdx);
  const setScroller = useCallback((node: HTMLDivElement | null) => {
    scrollerRef.current = node;
    if (node) node.scrollLeft = initialIdx.current * colWidth(node);
  }, []);

  // Days prepended to the window: shift by the same amount so the view
  // doesn't jump.
  useLayoutEffect(() => {
    const sc = scrollerRef.current;
    if (sc && pendingShift.current) {
      sc.scrollLeft += pendingShift.current * colWidth(sc);
      pendingShift.current = 0;
    }
  }, [span]);

  // Settle: track the leftmost day once scrolling rests, prefetch around it,
  // and grow the rendered window near either end.
  useEffect(() => {
    const sc = scrollerRef.current;
    if (!sc) return;
    let t = 0;
    const onScroll = () => {
      if (!movingRef.current) {
        movingRef.current = true;
        setMoving(true);
      }
      window.clearTimeout(t);
      t = window.setTimeout(() => {
        movingRef.current = false;
        setMoving(false);
        const idx = Math.round(sc.scrollLeft / colWidth(sc));
        setFirst(idx);
        if (idx < perView * 2) {
          pendingShift.current += EXTEND_DAYS;
          setSpan((s) => ({
            start: addDays(s.start, -EXTEND_DAYS),
            len: s.len + EXTEND_DAYS,
          }));
          setFirst(idx + EXTEND_DAYS);
        } else if (idx > days.length - perView * 3) {
          setSpan((s) => ({ ...s, len: s.len + EXTEND_DAYS }));
        }
      }, 120);
    };
    sc.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      sc.removeEventListener("scroll", onScroll);
      window.clearTimeout(t);
    };
  }, [days.length, perView]);

  useEffect(() => {
    if (!ready) return;
    const from = days[first];
    if (from) load(range(addDays(from, -perView), perView * 3));
  }, [ready, first, perView, days, load]);

  const scrollToIdx = useCallback((idx: number) => {
    const sc = scrollerRef.current;
    sc?.scrollTo({
      left: idx * colWidth(sc),
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  }, []);

  const page = useCallback(
    (dir: -1 | 1) => {
      setSelected(null);
      scrollToIdx(first + dir * perView);
    },
    [first, perView, scrollToIdx]
  );
  const goToday = useCallback(() => {
    setSelected(null);
    scrollToIdx(todayIdx);
  }, [todayIdx, scrollToIdx]);

  // ←/→ glide a page, t returns to today (ignored while typing).
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
      if (e.key === "ArrowLeft") page(-1);
      else if (e.key === "ArrowRight") page(1);
      else if (e.key === "t") goToday();
      else return;
      e.preventDefault();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [page, goToday]);

  /* ---- Layout ---- */

  const cols = useMemo(
    () =>
      days.map((d) => {
        const shown = resolveEvents(byDate[d] ?? [], overrides).filter(
          (e) => !e.hiddenBy
        );
        return {
          date: d,
          loaded: d in byDate,
          allDay: shown.filter((e) => e.allDay),
          timed: layoutDay(shown.filter((e) => !e.allDay)),
        };
      }),
    [days, byDate, overrides]
  );

  // Visible hours: 8am–8pm, stretched to fit loaded events so the grid height
  // stays put while you scroll.
  const timed = cols.flatMap((c) => c.timed);
  const startHour = Math.min(
    DEFAULT_START_HOUR,
    ...timed.map((p) => Math.floor(p.start / 60))
  );
  const endHour = Math.max(
    DEFAULT_END_HOUR,
    ...timed.map((p) => Math.ceil(Math.max(p.end, p.start + MIN_BLOCK_MIN) / 60))
  );
  const gridMin = startHour * 60;
  const gridPx = (endHour - startHour) * HOUR_PX;
  const marks = Array.from(
    { length: endHour - startHour },
    (_, i) => startHour + i
  ).filter((h) => h % 3 === 0 && h > startHour);
  const allDayRows = Math.max(0, ...cols.map((c) => c.allDay.length));
  const allDayPx = allDayRows ? allDayRows * ALLDAY_ROW_PX + 16 : 12;

  const visible = days.slice(first, first + perView);
  const sameMonth =
    visible.length > 0 &&
    fmtDay(visible[0], { month: "short" }) ===
      fmtDay(visible[visible.length - 1], { month: "short" });
  const rangeLabel =
    visible.length > 0
      ? `${fmtDay(visible[0], { month: "short", day: "numeric" })} – ${fmtDay(
          visible[visible.length - 1],
          sameMonth ? { day: "numeric" } : { month: "short", day: "numeric" }
        )}`
      : "";
  const atToday = first === todayIdx;

  const navBtn = "px-1 text-muted hover:text-foreground transition-colors";

  return (
    <>
      <div className="flex items-baseline justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Calendar</h1>
        <div className="flex items-baseline gap-1 text-[0.72rem] text-muted/80 tabular-nums">
          {ready && !atToday && (
            <button type="button" onClick={goToday} className={`${navBtn} mr-2`}>
              Today
            </button>
          )}
          <button
            type="button"
            onClick={() => page(-1)}
            aria-label="Earlier"
            className={navBtn}
          >
            ‹
          </button>
          <span className="min-w-[5.5rem] text-center">{rangeLabel}</span>
          <button
            type="button"
            onClick={() => page(1)}
            aria-label="Later"
            className={navBtn}
          >
            ›
          </button>
        </div>
      </div>

      {!configured && (
        <p className="text-[0.8rem] text-muted/80 italic">
          Calendar not connected — set GCAL_ICS_URLS to see events here.
        </p>
      )}

      <p
        aria-live="polite"
        className={`-my-3 min-h-[1.1rem] truncate text-[0.78rem] transition-opacity ${
          selected ? "opacity-100" : "opacity-0"
        }`}
      >
        {selected?.label}
      </p>

      <div className="flex">
        {/* Fixed gutter: header spacer, all-day label, hour marks */}
        <div className="w-7 shrink-0 sm:w-10">
          <div className="border-b border-rule" style={{ height: HEADER_PX }} />
          <div
            className="pt-2 text-[0.55rem] uppercase leading-none tracking-wide text-muted/60"
            style={{ height: allDayPx }}
          >
            <span className="hidden sm:inline">{allDayRows > 0 && "All day"}</span>
          </div>
          <div className="relative" style={{ height: gridPx }}>
            {marks.map((h) => (
              <span
                key={h}
                className="absolute left-0 -translate-y-1/2 text-[0.55rem] text-muted/55 tabular-nums sm:text-[0.6rem]"
                style={{ top: (h - startHour) * HOUR_PX }}
              >
                {fmtHour(h)}
              </span>
            ))}
          </div>
        </div>

        {/* Day strip — native scroll + snap, fogged edges (tweet carousel) */}
        <div className="relative min-w-0 flex-1">
          <div
            ref={setScroller}
            className={`blur-group overflow-x-auto overscroll-x-contain snap-x snap-mandatory scrollbar-hidden transition-opacity duration-300 ${
              ready ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="grid grid-flow-col auto-cols-[33.3333%] sm:auto-cols-[20%]">
              {cols.map((c) => {
                const isToday = c.date === today;
                const isPast = c.date < today;
                const nowMin =
                  now && now.dateKey === c.date ? now.min : null;
                return (
                  <div key={c.date} data-day className="snap-start">
                    {/* Header */}
                    <div
                      className="flex flex-col justify-end gap-0.5 border-b border-rule px-1.5 pb-2 sm:px-2"
                      style={{ height: HEADER_PX }}
                    >
                      <span
                        className={`text-[0.6rem] uppercase tracking-wide ${
                          isToday ? "text-foreground" : "text-muted/70"
                        }`}
                      >
                        {fmtDay(c.date, { weekday: "short" })}
                        {c.date.endsWith("-01") &&
                          ` · ${fmtDay(c.date, { month: "short" })}`}
                      </span>
                      <span
                        className={`relative self-start text-[0.95rem] leading-none tabular-nums tracking-tight ${
                          isToday
                            ? "text-foreground font-semibold"
                            : isPast
                              ? "text-muted/60"
                              : "text-foreground/85"
                        }`}
                      >
                        {Number(c.date.slice(8))}
                        {isToday && (
                          <span
                            aria-hidden
                            className="absolute -bottom-1 inset-x-0 h-px bg-foreground"
                          />
                        )}
                      </span>
                    </div>

                    {/* All-day */}
                    <div
                      className="flex min-w-0 flex-col px-1.5 pt-2 sm:px-2"
                      style={{ height: allDayPx }}
                    >
                      {c.allDay.map((e) => (
                        <div
                          key={e.uid}
                          title={e.displayTitle}
                          className={`blur-item truncate text-[0.64rem] sm:text-[0.7rem] ${
                            isPast ? "text-muted/60" : "text-muted"
                          }`}
                          style={{ height: ALLDAY_ROW_PX }}
                        >
                          {e.displayTitle}
                        </div>
                      ))}
                    </div>

                    {/* Timed — hairline rails sized by duration */}
                    <div
                      className={`relative mx-1.5 transition-opacity duration-300 sm:mx-2 ${
                        c.loaded || !configured ? "opacity-100" : "opacity-0"
                      }`}
                      style={{ height: gridPx }}
                    >
                      {c.timed.map((p) => {
                        const top = ((p.start - gridMin) / 60) * HOUR_PX;
                        const height = Math.max(
                          ((p.end - p.start) / 60) * HOUR_PX,
                          (MIN_BLOCK_MIN / 60) * HOUR_PX
                        );
                        const times = `${fmtClock(p.start)} – ${fmtClock(p.end)}`;
                        const past =
                          now !== null &&
                          (c.date < now.dateKey ||
                            (c.date === now.dateKey && p.end <= now.min));
                        const roomy = height >= 30;
                        const key = `${c.date}|${p.e.uid}|${p.start}`;
                        const isSelected = selected?.key === key;
                        return (
                          <button
                            type="button"
                            key={key}
                            title={`${p.e.displayTitle}\n${times}`}
                            onClick={() =>
                              setSelected(
                                isSelected
                                  ? null
                                  : {
                                      key,
                                      label: `${p.e.displayTitle} · ${fmtDay(
                                        c.date,
                                        { weekday: "short", month: "short", day: "numeric" }
                                      )}, ${times}`,
                                    }
                              )
                            }
                            className={`blur-item absolute overflow-hidden border-l pl-1 text-left sm:pl-1.5 ${
                              isSelected
                                ? "border-foreground"
                                : past
                                  ? "border-rule hover:border-muted"
                                  : "border-foreground/30 hover:border-foreground"
                            } ${roomy ? "flex flex-col justify-start" : "flex items-center"}`}
                            style={{
                              top: top + 1,
                              height: height - 2,
                              left: `calc(${(p.col / p.cols) * 100}% + ${p.col ? 2 : 0}px)`,
                              width: `calc(${100 / p.cols}% - ${p.col ? 2 : 0}px)`,
                              transitionProperty: "opacity, filter, border-color",
                            }}
                          >
                            {roomy ? (
                              <>
                                {/* Whole words only — narrow columns clip
                                    rather than splitting "CS229" mid-word. */}
                                <span
                                  className={`text-[0.64rem] leading-tight tracking-tight [overflow-wrap:normal] sm:text-[0.72rem] ${
                                    past && !isSelected ? "text-muted" : "text-foreground"
                                  }`}
                                >
                                  {p.e.displayTitle}
                                </span>
                                <span className="mt-0.5 whitespace-nowrap text-[0.58rem] leading-tight text-muted/70 tabular-nums sm:text-[0.62rem]">
                                  {times}
                                </span>
                              </>
                            ) : (
                              <span
                                className={`truncate text-[0.62rem] leading-none tracking-tight sm:text-[0.68rem] ${
                                  past && !isSelected ? "text-muted" : "text-foreground"
                                }`}
                              >
                                {p.e.displayTitle}
                                <span className="ml-1 text-muted/70 tabular-nums">
                                  {fmtClock(p.start)}
                                </span>
                              </span>
                            )}
                          </button>
                        );
                      })}

                      {/* Now — a faint hairline with a small node, no color */}
                      {isToday &&
                        nowMin !== null &&
                        nowMin >= gridMin &&
                        nowMin <= endHour * 60 && (
                          <div
                            aria-hidden
                            className="pointer-events-none absolute inset-x-0 z-10 h-px bg-foreground/40"
                            style={{ top: ((nowMin - gridMin) / 60) * HOUR_PX }}
                          >
                            <span className="absolute -left-[2.5px] -top-[2px] size-[5px] rounded-full bg-foreground" />
                          </div>
                        )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <span
            aria-hidden
            className={`tweet-edge tweet-edge-left !w-6 transition-opacity duration-300 sm:!w-10 ${
              moving ? "opacity-100" : "opacity-0"
            }`}
          />
          <span
            aria-hidden
            className={`tweet-edge tweet-edge-right !w-6 transition-opacity duration-300 sm:!w-10 ${
              moving ? "opacity-100" : "opacity-0"
            }`}
          />
        </div>
      </div>
    </>
  );
}
