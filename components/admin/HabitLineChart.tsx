"use client";

type Point = { date: string; value: number };

// Small SVG line chart of a rolling completion rate (0..1). No deps.
export default function HabitLineChart({
  points,
  label,
}: {
  points: Point[];
  label: string;
}) {
  const W = 320;
  const H = 64;
  const pad = 4;

  if (points.length === 0) return null;

  const n = points.length;
  const max = 1;
  const x = (i: number) =>
    pad + (i / Math.max(1, n - 1)) * (W - pad * 2);
  const y = (v: number) =>
    H - pad - (v / max) * (H - pad * 2);

  const line = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`)
    .join(" ");

  const area =
    `M ${x(0).toFixed(1)} ${(H - pad).toFixed(1)} ` +
    points.map((p, i) => `L ${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`).join(" ") +
    ` L ${x(n - 1).toFixed(1)} ${(H - pad).toFixed(1)} Z`;

  const latestVal = points[n - 1].value;
  const latest = Math.round(latestVal * 100);
  const dotTopPct = (y(latestVal) / H) * 100;
  const dotLeftPct = (x(n - 1) / W) * 100;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between">
        <span className="text-[0.8rem] font-medium">{label}</span>
        <span className="text-[0.7rem] text-muted tabular-nums">
          {latest}% · 7-day
        </span>
      </div>
      <div className="relative w-full h-12">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          <path d={area} fill="currentColor" className="text-foreground/8" />
          <path
            d={line}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinejoin="round"
            strokeLinecap="round"
            className="text-foreground"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        {/* Strobing "today" dot — HTML overlay keeps it perfectly round */}
        <span
          className="pulse-dot-el absolute block w-1.5 h-1.5 rounded-full bg-foreground -translate-x-1/2 -translate-y-1/2"
          style={{ top: `${dotTopPct}%`, left: `${dotLeftPct}%` }}
          aria-hidden
        />
      </div>
    </div>
  );
}
