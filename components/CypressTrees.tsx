"use client";

import { useEffect } from "react";

// Monterey cypresses flanking the home column. Assets live in public/cypress:
// two transparent WebP trees, the <cypress-tree> custom element (cypress.js)
// and its pen-stroke paths (traces.js). Each load draws the trees in
// (~2.4s of line strokes resolving into the photo texture), then a gentle
// wind loops forever. Reduced-motion users get the finished still trees.
// Sizing/placement and the blur veil over the column are in globals.css;
// hidden below 960px wide.

let loading: Promise<void> | null = null;

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = false;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`failed to load ${src}`));
    document.head.append(s);
  });
}

// Traces must exist before the element is defined, or the intro would
// start with nothing to draw — so load them in order, once per page life.
function ensureCypressElement() {
  if (customElements.get("cypress-tree")) return Promise.resolve();
  loading ??= loadScript("/cypress/traces.js").then(() =>
    loadScript("/cypress/cypress.js")
  );
  return loading;
}

export default function CypressTrees() {
  useEffect(() => {
    ensureCypressElement().catch((err) => console.error("[cypress]", err));
  }, []);

  return (
    <div aria-hidden className="cypress-flanks">
      <div className="cypress-flank cypress-flank-left">
        <cypress-tree src="/cypress/cypress-left.webp" side="left" mode="both" />
      </div>
      <div className="cypress-flank cypress-flank-right">
        <cypress-tree src="/cypress/cypress-right.webp" side="right" mode="both" />
      </div>
      {/* frosts the trees where they pass behind the text column */}
      <div className="cypress-veil" />
    </div>
  );
}
