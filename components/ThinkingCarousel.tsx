"use client";

import { useEffect, useState } from "react";

type Props = {
  phrases: string[];
  cycleMs?: number;
  typeMs?: number;
};

export default function ThinkingCarousel({
  phrases,
  cycleMs = 4500,
  typeMs = 35,
}: Props) {
  const [idx, setIdx] = useState(0);
  const [typed, setTyped] = useState("");
  const [deleting, setDeleting] = useState(false);

  const visible = phrases.length ? phrases : ["—"];
  const current = visible[idx % visible.length];
  const isComplete = !deleting && typed === current;

  useEffect(() => {
    if (!deleting && typed === current) {
      const t = setTimeout(() => setDeleting(true), cycleMs);
      return () => clearTimeout(t);
    }

    if (deleting && typed === "") {
      setDeleting(false);
      setIdx((i) => (i + 1) % visible.length);
      return;
    }

    const t = setTimeout(
      () => {
        setTyped((prev) =>
          deleting ? prev.slice(0, -1) : current.slice(0, prev.length + 1)
        );
      },
      deleting ? typeMs / 2 : typeMs
    );
    return () => clearTimeout(t);
  }, [typed, deleting, idx, current, cycleMs, typeMs]);

  return (
    <p className="italic text-center text-muted/80 leading-relaxed text-[1.05rem] min-h-[3.25em] sm:min-h-0">
      I&apos;m thinking about{" "}
      <span className="text-foreground not-italic">
        {typed}
        <span
          className={`inline-block w-[1px] h-[1em] bg-foreground align-[-0.15em] ml-0.5 ${
            isComplete ? "animate-blink" : ""
          }`}
        />
      </span>
      .
    </p>
  );
}
