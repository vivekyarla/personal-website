"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// First-party visit beacon. Mounted once in the root layout; fires on every
// route change. Fire-and-forget — never surfaces errors to the visitor.
export default function VisitLogger() {
  const pathname = usePathname();
  const sentFirst = useRef(false);

  useEffect(() => {
    if (!pathname) return;
    if (pathname.startsWith("/admin") || pathname.startsWith("/api")) return;

    // document.referrer only means anything for the initial pageview —
    // client-side navigations keep the original referrer, so drop it.
    const referrer = sentFirst.current ? null : document.referrer || null;
    sentFirst.current = true;

    fetch("/api/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname, referrer }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  return null;
}
