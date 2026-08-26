"use client";

import { useEffect, useState } from "react";

// Hard-pinned to Pacific Time — the clock reads "08:25:48 PM in Stanford, CA"
// no matter where the viewer is.
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

  return {
    hour: map.hour ?? "--",
    minute: map.minute ?? "--",
    second: map.second ?? "--",
    dayPeriod: map.dayPeriod ?? "",
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
    return <div className="text-xs text-muted/70 h-[1.1em]" />;
  }

  const { hour, minute, second, dayPeriod } = getParts(now);

  return (
    <div className="text-xs text-muted/70 tabular-nums tracking-tight whitespace-nowrap">
      <span className="font-mono">
        {hour}:{minute}:{second} {dayPeriod}
      </span>{" "}
      <span className="text-[0.8rem]">in Stanford, CA</span>
    </div>
  );
}
