"use client";

import { useRef, useState } from "react";
import { formatBookMonth, groupBooks, type Book } from "@/lib/books";
import { useScrollSpotlight } from "@/components/useScrollSpotlight";

// Books column: Up next → Reading → Finished (newest month first). Each row
// shows the cover, title/author and month; clicking it opens the review,
// page count and a larger cover.
const SECTIONS = [
  { key: "future", label: "Up next" },
  { key: "reading", label: "Reading" },
  { key: "finished", label: "Finished" },
] as const;

export default function BooksSection({ books }: { books: Book[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  useScrollSpotlight(ref);
  const groups = groupBooks(books);

  if (books.length === 0) {
    return <p className="py-3 text-muted text-[0.85rem] italic">Nothing here yet.</p>;
  }

  return (
    <div ref={ref} className="tweet-spot-group">
      {SECTIONS.map(({ key, label }) =>
        groups[key].length === 0 ? null : (
          <div key={key}>
            <div className="flex items-baseline justify-between pt-4 pb-1 text-[0.68rem] uppercase tracking-wide text-muted/80 first:pt-0">
              <span>{label}</span>
              <span className="tabular-nums text-muted/60">{groups[key].length}</span>
            </div>
            <ul>
              {groups[key].map((b) => (
                <BookRow
                  key={b.id}
                  book={b}
                  open={open === b.id}
                  onToggle={() => setOpen((o) => (o === b.id ? null : b.id))}
                />
              ))}
            </ul>
          </div>
        )
      )}
    </div>
  );
}

function Cover({ book, className }: { book: Book; className: string }) {
  return (
    <span
      className={`block shrink-0 overflow-hidden rounded-[2px] bg-foreground/[0.06] shadow-[0_1px_2px_rgba(0,0,0,0.12)] ${className}`}
    >
      {book.cover_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={book.cover_url}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
      )}
    </span>
  );
}

function statusLine(b: Book): string {
  const month = formatBookMonth(b.read_month);
  if (b.status === "finished") return month ? `Finished ${month}` : "Finished";
  if (b.status === "reading") return month ? `Started ${month}` : "Reading now";
  return month ? `Planned for ${month}` : "Up next";
}

function BookRow({ book: b, open, onToggle }: { book: Book; open: boolean; onToggle: () => void }) {
  const month = formatBookMonth(b.read_month);
  return (
    <li className="tweet-spot-item relative border-t border-b border-rule -mt-px first:mt-0 first:border-t-0 last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 py-2.5 text-left cursor-pointer"
      >
        <Cover book={b} className="h-12 w-8" />
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block font-medium truncate">{b.title}</span>
          {b.author && <span className="block text-[0.8rem] text-muted truncate">{b.author}</span>}
        </span>
        {month && (
          <span className="shrink-0 text-[0.72rem] text-muted/80 tabular-nums">{month}</span>
        )}
      </button>

      {/* Details — grid-rows 0fr↔1fr collapse, the site's standard */}
      <div
        className={`grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="flex gap-4 pb-3.5 pt-1">
            <Cover book={b} className="h-[7.5rem] w-20" />
            <div className="min-w-0 flex-1">
              <div className="text-[0.72rem] text-muted/80 tabular-nums">
                {[statusLine(b), b.pages && `${b.pages} pages`].filter(Boolean).join(" · ")}
              </div>
              {b.review ? (
                <p className="mt-1.5 text-[0.85rem] leading-relaxed text-muted whitespace-pre-line">
                  {b.review}
                </p>
              ) : (
                <p className="mt-1.5 text-[0.85rem] italic text-muted/60">No review yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}
