"use client";

import { useEffect, useRef, useState } from "react";
import type { TweetWithCategory } from "@/lib/tweets";

declare global {
  interface Window {
    twttr?: { widgets: { load: (el?: HTMLElement) => void } };
  }
}

export default function TweetCard({ tweet }: { tweet: TweetWithCategory }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDark, setIsDark] = useState(false);

  // Watch the html.dark class so embeds re-theme on toggle.
  useEffect(() => {
    function sync() {
      setIsDark(document.documentElement.classList.contains("dark"));
    }
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  // Re-insert the embed HTML and ask Twitter to render it whenever theme
  // changes. We set data-theme on the blockquote before letting widgets.js
  // pick it up.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !tweet.embed_html) return;
    el.innerHTML = tweet.embed_html;
    const bq = el.querySelector("blockquote.twitter-tweet");
    if (bq) {
      bq.setAttribute("data-theme", isDark ? "dark" : "light");
    }
    if (typeof window !== "undefined" && window.twttr?.widgets) {
      window.twttr.widgets.load(el);
    }
  }, [isDark, tweet.embed_html]);

  if (!tweet.embed_html) {
    return (
      <div>
        <a
          href={tweet.url}
          target="_blank"
          rel="noreferrer"
          className="block p-4 text-sm text-muted hover:text-foreground transition-colors"
        >
          {tweet.author_name ?? "View on X"} → {tweet.url}
        </a>
        {tweet.note && (
          <p className="mt-1 text-[0.8rem] italic text-muted">{tweet.note}</p>
        )}
      </div>
    );
  }

  return (
    <div>
      <div
        ref={containerRef}
        className="tweet-embed [&_blockquote]:!my-0 [&_iframe]:!w-full"
      />
      {tweet.note && (
        <p className="mt-1 text-[0.8rem] italic text-muted">{tweet.note}</p>
      )}
    </div>
  );
}
