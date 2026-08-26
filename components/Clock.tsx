"use client";

import { useEffect, useState } from "react";

// Hard-pinned to Pacific Time — "08:25:48 PM in Stanford, CA · Thursday,
// August 28" no matter where the viewer is.
const TZ = "America/Los_Angeles";

function getParts(d: Date) {
  const timeParts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).formatToParts(d);

  const map: Record<string, string> = {};
  for (const p of timeParts) {
    if (p.type !== "literal") map[p.type] = p.value;
  }

  const date = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(d);

  return {
    hour: map.hour ?? "--",
    minute: map.minute ?? "--",
    second: map.second ?? "--",
    dayPeriod: map.dayPeriod ?? "",
    date,
  };
}

export default function Clock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!now) {
    return <div className="h-[1.9rem]" />;
  }

  const { hour, minute, second, dayPeriod, date } = getParts(now);

  return (
    <div className="text-right tracking-tight whitespace-nowrap leading-tight tabular-nums">
      <div className="text-[0.8rem] text-muted/70">{date}</div>
      <div className="text-[0.8rem] text-muted/70">
        {/* AM/PM sits outside the mono span so the gaps around it are the
            same width (mono spaces are wider than the text face's). */}
        <span className="font-mono">
          {hour}:{minute}:{second}
        </span>{" "}
        <span className="text-[0.8rem]">{dayPeriod} in Stanford, CA</span>
      </div>
    </div>
  );
}
