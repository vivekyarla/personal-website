"use client";

import { useEffect, useState } from "react";

export default function NameToggle() {
  const [inverted, setInverted] = useState(false);

  // Sync state with the class applied by the pre-hydration script (sunset auto-dark)
  useEffect(() => {
    setInverted(document.documentElement.classList.contains("invert"));
  }, []);

  function toggle() {
    const next = !inverted;
    setInverted(next);
    document.documentElement.classList.toggle("invert", next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={inverted}
      aria-label="Invert color scheme"
      className="text-2xl font-semibold tracking-tight text-left cursor-pointer hover:opacity-70 transition-opacity"
    >
      Vivek Yarlagedda
    </button>
  );
}
