"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Habit, HabitEntry } from "@/lib/habits";
import HabitLineChart from "@/components/admin/HabitLineChart";

type Props = {
  habits: Habit[];
  entries: HabitEntry[];
  dates: string[]; // oldest → newest, ends today
  today: string;
};

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

export default function HabitTracker({ habits, entries, dates, today }: Props) {
  // Optimistic done-set.
  const [done, setDone] = useState<Set<string>>(
    () => new Set(entries.map((e) => keyOf(e.habit_id, e.date)))
  );
  const gridScrollRef = useRef<HTMLDivElement>(null);

  // Scroll the grid to the newest date on mount.
  useEffect(() => {
    const el = gridScrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, []);

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

  // Rolling 7-day completion rate for charted habits.
  const charts = useMemo(() => {
    return habits
      .filter((h) => h.show_chart)
      .map((h) => {
        const points = dates.map((d, i) => {
          // window = up to 7 days ending at d
          const windowDates = dates.slice(Math.max(0, i - 6), i + 1);
          const hits = windowDates.filter((wd) =>
            done.has(keyOf(h.id, wd))
          ).length;
          return { date: d, value: hits / windowDates.length };
        });
        return { habit: h, points };
      });
  }, [habits, dates, done]);

  return (
    <div className="flex flex-col gap-8">
      {/* Marcus Aurelius */}
      <p className="mb-3 leading-relaxed italic text-center text-muted text-[0.9rem]">
        &ldquo;Waste no more time arguing about what a good man should be. Be
        one.&rdquo;
      </p>

      {/* Reminders for missing core habits */}
      {coreHabits.length > 0 && (
        <div className="flex flex-col gap-2">
          {missingCore.length === 0 ? (
            <p className="text-center text-[0.9rem] text-muted italic">
              Every core habit done today. Hold the line.
            </p>
          ) : (
            missingCore
              .filter((h) => h.reminder)
              .map((h) => (
                <p
                  key={h.id}
                  className="text-center text-[0.9rem] leading-relaxed border-l-2 border-rule pl-3"
                >
                  {h.reminder}
                </p>
              ))
          )}
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
          <div className="flex border border-rule rounded-sm overflow-hidden">
            {/* Sticky habit-name column */}
            <div className="shrink-0 bg-background border-r border-rule">
              <div className="h-8 border-b border-rule" />
              {habits.map((h) => (
                <div
                  key={h.id}
                  className="h-9 px-3 flex items-center text-[0.8rem] whitespace-nowrap border-b border-rule last:border-b-0 max-w-[40vw] truncate"
                >
                  {h.name}
                </div>
              ))}
            </div>
            {/* Scrollable date columns */}
            <div ref={gridScrollRef} className="overflow-x-auto scrollbar-hidden flex-1">
              <div className="inline-flex flex-col min-w-full">
                {/* Date header */}
                <div className="flex h-8 border-b border-rule">
                  {dates.map((d) => {
                    const { dow, day } = shortDate(d);
                    const isToday = d === today;
                    return (
                      <div
                        key={d}
                        className={`w-9 shrink-0 flex flex-col items-center justify-center leading-none ${
                          isToday ? "bg-foreground/5" : ""
                        }`}
                      >
                        <span className="text-[0.55rem] text-muted/70 uppercase">
                          {dow}
                        </span>
                        <span className="text-[0.7rem] tabular-nums">{day}</span>
                      </div>
                    );
                  })}
                </div>
                {/* Cells */}
                {habits.map((h) => (
                  <div key={h.id} className="flex h-9 border-b border-rule last:border-b-0">
                    {dates.map((d) => {
                      const checked = done.has(keyOf(h.id, d));
                      const isToday = d === today;
                      return (
                        <button
                          key={d}
                          type="button"
                          onClick={() => toggle(h.id, d)}
                          aria-label={`${h.name} ${d}`}
                          className={`w-9 shrink-0 flex items-center justify-center ${
                            isToday ? "bg-foreground/5" : ""
                          }`}
                        >
                          <span
                            className={`w-4 h-4 rounded-[3px] border transition-colors ${
                              checked
                                ? "bg-foreground border-foreground"
                                : "border-rule"
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
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
