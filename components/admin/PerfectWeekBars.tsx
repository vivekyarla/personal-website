"use client";

type Week = {
  label: string; // e.g. "May 4"
  count: number; // perfect days that week (0..7)
  isCurrent: boolean;
};

export default function PerfectWeekBars({ weeks }: { weeks: Week[] }) {
  if (weeks.length === 0) return null;
  const total = weeks.reduce((s, w) => s + w.count, 0);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between">
        <span className="text-[0.8rem] font-medium">Perfect days</span>
        <span className="text-[0.7rem] text-muted tabular-nums">
          {total} total
        </span>
      </div>
      <div className="flex items-end gap-1.5 h-16">
        {weeks.map((w, i) => {
          const pct = (w.count / 7) * 100;
          return (
            <div
              key={i}
              className="flex-1 h-full flex flex-col justify-end items-center gap-1 min-w-0"
              title={`${w.label}: ${w.count}/7 perfect`}
            >
              <div className="w-full flex items-end justify-center h-full">
                <div
                  className={`w-full max-w-5 rounded-sm transition-[height] ${
                    w.isCurrent ? "bg-amber-400" : "bg-amber-300/70"
                  }`}
                  style={{ height: `${Math.max(pct, w.count > 0 ? 6 : 2)}%` }}
                />
              </div>
              {w.count > 0 && (
                <span className="text-[0.55rem] text-muted tabular-nums leading-none">
                  {w.count}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
