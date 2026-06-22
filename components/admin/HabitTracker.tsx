"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Habit, HabitEntry } from "@/lib/habits";
import HabitLineChart from "@/components/admin/HabitLineChart";

type Props = {
  habits: Habit[];
  entries: HabitEntry[];
  dates: string[]; // oldest → newest, ends on Saturday of current week
  today: string;
  weekStartIndex: number; // index of current week's Sunday
  todayIndex: number; // index of today within `dates`
};

const COL_W = 36; // matches w-9

function keyOf(habitId: string, date: string) {
  return `${habitId}|${date}`;
}

function shortDate(iso: string) {
  const d = new Date(iso + "T12:00:00Z");
  return {
    dow: d.toLocaleDateString("en-US", { weekday: "narrow", timeZone: "UTC" }),
    day: d.getUTCDate(),
  };
}

export default function HabitTracker({
  habits,
  entries,
  dates,
  today,
  weekStartIndex,
  todayIndex,
}: Props) {
  // Optimistic done-set.
  const [done, setDone] = useState<Set<string>>(
    () => new Set(entries.map((e) => keyOf(e.habit_id, e.date)))
  );
  const gridScrollRef = useRef<HTMLDivElement>(null);

  // On mount, anchor the scroll so the current week's Sunday sits at the left
  // edge of the date columns (future days to the right, past reachable left).
  useEffect(() => {
    const el = gridScrollRef.current;
    if (el) el.scrollLeft = weekStartIndex * COL_W;
  }, [weekStartIndex]);

  async function toggle(habitId: string, date: string) {
    const k = keyOf(habitId, date);
    const nextDone = !done.has(k);
    setDone((prev) => {
      const next = new Set(prev);
      if (nextDone) next.add(k);
      else next.delete(k);
      return next;
    });
    try {
      await fetch("/api/habit-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ habit_id: habitId, date, done: nextDone }),
      });
    } catch {
      // revert on failure
      setDone((prev) => {
        const next = new Set(prev);
        if (nextDone) next.delete(k);
        else next.add(k);
        return next;
      });
    }
  }

  const coreHabits = habits.filter((h) => h.is_core);
  const missingCore = coreHabits.filter((h) => !done.has(keyOf(h.id, today)));
  // Habits arrive sorted by position (priority), so the first missing core
  // habit with a reminder is the highest-priority nudge for today.
  const topReminder = missingCore.find((h) => h.reminder)?.reminder ?? null;

  // Momentum (exponential moving average) for charted habits — recent days
  // weighted more, so one miss is a small local dip that recovers rather than
  // a 7-point drag. Computed only through today.
  const charts = useMemo(() => {
    const chartDates = dates.slice(0, todayIndex + 1);
    const N = 10; // smoothing window
    const ALPHA = 2 / (N + 1);
    return habits
      .filter((h) => h.show_chart)
      .map((h) => {
        let ema = 0;
        const points = chartDates.map((d, i) => {
          const v = done.has(keyOf(h.id, d)) ? 1 : 0;
          ema = i === 0 ? v : ema + ALPHA * (v - ema);
          return { date: d, value: ema };
        });
        return { habit: h, points };
      });
  }, [habits, dates, done, todayIndex]);

  return (
    <div className="flex flex-col gap-8">
      {/* Marcus Aurelius */}
      <p className="leading-relaxed italic text-center text-muted text-[0.9rem]">
        &ldquo;Waste no more time arguing about what a good man should be. Be
        one.&rdquo;
        <span className="block not-italic mt-1 text-muted/70">
          — Marcus Aurelius
        </span>
      </p>

      {/* Single highest-priority reminder */}
      {coreHabits.length > 0 && (
        <div className="text-center text-[0.9rem] leading-relaxed min-h-[1.5em]">
          {missingCore.length === 0 ? (
            <p className="text-muted italic">
              Every core habit done today. Hold the line.
            </p>
          ) : topReminder ? (
            <p>
              <span className="reminder-highlight">{topReminder}</span>
            </p>
          ) : null}
        </div>
      )}

      {/* Today quick-check */}
      {coreHabits.length > 0 && (
        <section>
          <h2 className="text-base font-semibold tracking-tight mb-3">Today</h2>
          <div className="flex flex-col gap-2">
            {coreHabits.map((h) => {
              const checked = done.has(keyOf(h.id, today));
              return (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => toggle(h.id, today)}
                  className="flex items-center gap-3 py-2 px-3 border border-rule rounded-sm text-left hover:border-foreground/40 transition-colors"
                >
                  <span
                    className={`shrink-0 w-5 h-5 rounded-sm border flex items-center justify-center transition-colors ${
                      checked
                        ? "bg-foreground border-foreground text-background"
                        : "border-rule"
                    }`}
                  >
                    {checked && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path
                          d="M2.5 6.5L5 9L9.5 3.5"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </span>
                  <span
                    className={`text-[0.95rem] ${checked ? "line-through text-muted" : ""}`}
                  >
                    {h.name}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Full grid */}
      <section>
        <h2 className="text-base font-semibold tracking-tight mb-3">All habits</h2>
        {habits.length === 0 ? (
          <p className="text-muted italic text-[0.85rem]">
            No habits yet. Add some below.
          </p>
        ) : (
          <div
            ref={gridScrollRef}
            className="overflow-x-auto scrollbar-hidden border border-rule rounded-sm"
          >
            <table className="border-collapse w-full" style={{ tableLayout: "auto" }}>
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 bg-background h-9 border-b border-r border-rule" />
                  {dates.map((d) => {
                    const { dow, day } = shortDate(d);
                    const isToday = d === today;
                    return (
                      <th
                        key={d}
                        className={`w-9 min-w-9 h-9 border-b border-rule font-normal align-middle ${
                          isToday ? "bg-foreground/5" : ""
                        }`}
                      >
                        <div className="flex flex-col items-center justify-center leading-none">
                          <span className="text-[0.55rem] text-muted/70 uppercase">
                            {dow}
                          </span>
                          <span className="text-[0.7rem] tabular-nums">{day}</span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {habits.map((h) => (
                  <tr key={h.id}>
                    <td className="sticky left-0 z-10 bg-background h-9 px-3 border-b border-r border-rule text-[0.8rem] whitespace-nowrap max-w-[40vw] truncate">
                      {h.name}
                    </td>
                    {dates.map((d) => {
                      const checked = done.has(keyOf(h.id, d));
                      const isToday = d === today;
                      return (
                        <td
                          key={d}
                          className={`w-9 min-w-9 h-9 border-b border-rule p-0 ${
                            isToday ? "bg-foreground/5" : ""
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => toggle(h.id, d)}
                            aria-label={`${h.name} ${d}`}
                            className="w-full h-9 flex items-center justify-center"
                          >
                            <span
                              className={`w-4 h-4 rounded-[3px] border transition-colors ${
                                checked
                                  ? "bg-foreground border-foreground"
                                  : "border-rule"
                              }`}
                            />
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Charts */}
      {charts.length > 0 && (
        <section>
          <h2 className="text-base font-semibold tracking-tight mb-3">Trends</h2>
          <div className="flex flex-col gap-5">
            {charts.map(({ habit, points }) => (
              <HabitLineChart key={habit.id} label={habit.name} points={points} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
