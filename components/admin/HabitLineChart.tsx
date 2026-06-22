"use client";

import { useId } from "react";

type Point = { date: string; value: number };

// momentum value (0..1) → color along green(top) → amber → red(bottom)
function valueColor(v: number): string {
  if (v >= 0.66) return "#16a34a"; // green
  if (v >= 0.4) return "#d39b1a"; // amber
  return "#ef4444"; // red
}

// Small SVG momentum chart (0..1), colored by height: green = strong,
// red = slacking, smooth amber transition. No deps.
export default function HabitLineChart({
  points,
  label,
}: {
  points: Point[];
  label: string;
}) {
  const id = useId().replace(/[:]/g, "");
  const W = 320;
  const H = 64;
  const pad = 4;

  if (points.length === 0) return null;

  const n = points.length;
  const x = (i: number) => pad + (i / Math.max(1, n - 1)) * (W - pad * 2);
  const y = (v: number) => H - pad - v * (H - pad * 2);

  const line = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`)
    .join(" ");

  const area =
    `M ${x(0).toFixed(1)} ${(H - pad).toFixed(1)} ` +
    points.map((p, i) => `L ${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`).join(" ") +
    ` L ${x(n - 1).toFixed(1)} ${(H - pad).toFixed(1)} Z`;

  const latestVal = points[n - 1].value;
  const latest = Math.round(latestVal * 100);
  const dotColor = valueColor(latestVal);
  const dotTopPct = (y(latestVal) / H) * 100;
  const dotLeftPct = (x(n - 1) / W) * 100;

  const strokeGrad = `stroke-${id}`;
  const fillGrad = `fill-${id}`;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between">
        <span className="text-[0.8rem] font-medium">{label}</span>
        <span
          className="text-[0.7rem] tabular-nums font-medium"
          style={{ color: dotColor }}
        >
          {latest}% momentum
        </span>
      </div>
      <div className="relative w-full h-12">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          <defs>
            {/* Vertical gradient: top = green (strong), bottom = red (slack) */}
            <linearGradient
              id={strokeGrad}
              gradientUnits="userSpaceOnUse"
              x1="0"
              y1={pad}
              x2="0"
              y2={H - pad}
            >
              <stop offset="0%" stopColor="#16a34a" />
              <stop offset="42%" stopColor="#d39b1a" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
            <linearGradient
              id={fillGrad}
              gradientUnits="userSpaceOnUse"
              x1="0"
              y1={pad}
              x2="0"
              y2={H - pad}
            >
              <stop offset="0%" stopColor="#16a34a" stopOpacity="0.22" />
              <stop offset="42%" stopColor="#d39b1a" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.18" />
            </linearGradient>
          </defs>
          <path d={area} fill={`url(#${fillGrad})`} />
          <path
            d={line}
            fill="none"
            stroke={`url(#${strokeGrad})`}
            strokeWidth={1.75}
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        {/* Strobing "today" dot — HTML overlay keeps it perfectly round */}
        <span
          className="pulse-dot-el absolute block w-1.5 h-1.5 rounded-full -translate-x-1/2 -translate-y-1/2"
          style={{
            top: `${dotTopPct}%`,
            left: `${dotLeftPct}%`,
            backgroundColor: dotColor,
            color: dotColor,
          }}
          aria-hidden
        />
      </div>
    </div>
  );
}
