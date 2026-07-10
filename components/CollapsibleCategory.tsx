"use client";

import { useState } from "react";

type Props = {
  name: string;
  count: number;
  defaultOpen?: boolean;
  className?: string;
  children: React.ReactNode;
};

export default function CollapsibleCategory({
  name,
  count,
  defaultOpen = false,
  className = "",
  children,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className={`pb-6 ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-baseline justify-between gap-3 group cursor-pointer text-left"
      >
        <h2 className="text-base font-semibold tracking-tight group-hover:opacity-70 transition-opacity">
          {name}
        </h2>
        <span className="text-muted text-xs flex items-baseline gap-2 tabular-nums">
          <span>{count}</span>
          <span
            className={`inline-block transition-transform duration-300 ${
              open ? "rotate-90" : ""
            }`}
            aria-hidden
          >
            ›
          </span>
        </span>
      </button>
      <hr className="border-rule mt-3" />
      <div
        aria-hidden={!open}
        className={`grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        {/* Clip only vertically: the collapse animation needs y-clipping, but
            the full-bleed carousel must overflow horizontally. */}
        <div className="overflow-y-clip overflow-x-visible">
          <div className="pt-4">{children}</div>
        </div>
      </div>
    </section>
  );
}
