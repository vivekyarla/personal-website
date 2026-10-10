"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BOOK_STATUSES, type Book, type BookStatus } from "@/lib/books";

type Candidate = { cover_url: string; pages: number | null; title: string; year: number | null };

const MONTH_LABEL: Record<BookStatus, string> = {
  future: "Planned for (optional)",
  reading: "Started",
  finished: "Finished",
};

// Add / edit a book. The cover (and page count, if blank) is looked up
// automatically from the title + author; ‹ › cycles alternatives, and a
// custom image URL or "no cover" are one click away.
export default function BookForm({
  initial,
  currentMonth,
}: {
  initial?: Book;
  currentMonth: string; // YYYY-MM (PT), default for new books
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [author, setAuthor] = useState(initial?.author ?? "");
  const [status, setStatus] = useState<BookStatus>(initial?.status ?? "finished");
  const [month, setMonth] = useState(
    initial ? (initial.read_month?.slice(0, 7) ?? "") : currentMonth
  );
  const [pages, setPages] = useState(initial?.pages ? String(initial.pages) : "");
  const [review, setReview] = useState(initial?.review ?? "");
  const [cover, setCover] = useState<string | null>(initial?.cover_url ?? null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [looking, setLooking] = useState(false);
  const [customCover, setCustomCover] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // user picked/cleared a cover by hand → stop auto-replacing it
  const coverTouched = useRef(!!initial?.cover_url);
  const pagesTouched = useRef(!!initial?.pages);

  // Auto-lookup once title (+ author) settle.
  useEffect(() => {
    const t = title.trim();
    if (t.length < 2) return;
    const id = window.setTimeout(async () => {
      setLooking(true);
      try {
        const res = await fetch(
          `/api/books/lookup?${new URLSearchParams({ title: t, author: author.trim() })}`
        );
        const { candidates: found = [] } = res.ok ? await res.json() : {};
        setCandidates(found);
        if (found[0]) {
          if (!coverTouched.current) setCover(found[0].cover_url);
          if (!pagesTouched.current && found[0].pages) setPages(String(found[0].pages));
        }
      } finally {
        setLooking(false);
      }
    }, 650);
    return () => window.clearTimeout(id);
  }, [title, author]);

  const idx = candidates.findIndex((c) => c.cover_url === cover);
  function cycle(dir: 1 | -1) {
    if (candidates.length === 0) return;
    const next = candidates[(Math.max(0, idx) + dir + candidates.length) % candidates.length];
    coverTouched.current = true;
    setCover(next.cover_url);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const payload = {
        title: title.trim(),
        author: author.trim() || null,
        status,
        read_month: month || null,
        pages: pages ? Number(pages) : null,
        review: review.trim() || null,
        cover_url: cover,
      };
      const res = await fetch(initial ? `/api/books/${initial.id}` : "/api/books", {
        method: initial ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "save failed");
      }
      router.push("/admin/inbound");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed");
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    "w-full border border-rule rounded-sm py-2 px-3 text-sm bg-transparent focus:outline-none focus:border-foreground";
  const small = "text-xs text-muted hover:text-foreground transition-colors disabled:opacity-40";

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      {/* Status */}
      <div className="flex gap-2">
        {BOOK_STATUSES.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => setStatus(s.value)}
            aria-pressed={status === s.value}
            className={`text-[0.75rem] uppercase tracking-wide px-2.5 py-1 border rounded-sm transition-colors ${
              status === s.value
                ? "border-foreground bg-foreground text-background"
                : "border-rule text-muted hover:text-foreground"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="flex gap-5">
        {/* Cover */}
        <div className="flex w-28 shrink-0 flex-col items-center gap-1.5">
          <div className="flex aspect-[2/3] w-28 items-center justify-center overflow-hidden rounded-sm border border-rule bg-foreground/[0.03]">
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cover} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="px-2 text-center text-[0.7rem] text-muted/70">
                {looking ? "Finding cover…" : "No cover"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => cycle(-1)} disabled={candidates.length < 2} className={small} aria-label="Previous cover">‹</button>
            <span className="text-[0.65rem] text-muted/70 tabular-nums">
              {candidates.length ? `${Math.max(0, idx) + 1}/${candidates.length}` : looking ? "…" : "–"}
            </span>
            <button type="button" onClick={() => cycle(1)} disabled={candidates.length < 2} className={small} aria-label="Next cover">›</button>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setCustomCover((v) => !v)} className={small}>URL</button>
            <button
              type="button"
              onClick={() => { coverTouched.current = true; setCover(null); }}
              disabled={!cover}
              className={small}
            >
              Remove
            </button>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <Field label="Title">
            <input required className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="Author">
            <input className={inputClass} value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Ayn Rand" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label={MONTH_LABEL[status]}>
              <input
                type="month"
                required={status !== "future"}
                className={inputClass}
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              />
            </Field>
            <Field label="Pages">
              <input
                type="number"
                min={1}
                className={inputClass}
                value={pages}
                onChange={(e) => { pagesTouched.current = true; setPages(e.target.value); }}
              />
            </Field>
          </div>
        </div>
      </div>

      {customCover && (
        <Field label="Cover image URL">
          <input
            type="url"
            className={inputClass}
            value={cover ?? ""}
            placeholder="https://"
            onChange={(e) => { coverTouched.current = true; setCover(e.target.value || null); }}
          />
        </Field>
      )}

      <Field label="Review">
        <textarea rows={4} className={inputClass} value={review} onChange={(e) => setReview(e.target.value)} />
      </Field>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={busy}
          className="border border-foreground bg-foreground text-background rounded-sm py-2 px-4 text-sm hover:opacity-80 transition-opacity disabled:opacity-50"
        >
          {busy ? "Saving…" : initial ? "Save changes" : "Add book"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/inbound")}
          className="text-sm text-muted hover:text-foreground transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs uppercase tracking-wide text-muted">{label}</span>
      {children}
    </label>
  );
}
