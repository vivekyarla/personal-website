"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { InboundReading } from "@/lib/inbound";

type Props = { initial?: InboundReading };

export default function InboundForm({ initial }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [url, setUrl] = useState(initial?.url ?? "");
  const [source, setSource] = useState(initial?.source ?? "");
  const [tag, setTag] = useState(initial?.tag ?? "");
  const [dateRead, setDateRead] = useState(
    initial?.date_published ?? new Date().toISOString().slice(0, 10)
  );
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [quotes, setQuotes] = useState<string[]>(
    initial?.quotes?.length ? initial.quotes : [""]
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateQuote(i: number, value: string) {
    setQuotes((qs) => qs.map((q, idx) => (idx === i ? value : q)));
  }
  function addQuote() {
    setQuotes((qs) => [...qs, ""]);
  }
  function removeQuote(i: number) {
    setQuotes((qs) => qs.filter((_, idx) => idx !== i));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const payload = {
        title: title.trim(),
        url: url.trim(),
        source: source.trim() || null,
        tag: tag.trim() || null,
        date_published: dateRead,
        summary: summary.trim(),
        quotes: quotes.map((q) => q.trim()).filter((q) => q.length > 0),
      };
      const endpoint = initial ? `/api/inbound/${initial.id}` : "/api/inbound";
      const method = initial ? "PATCH" : "POST";
      const res = await fetch(endpoint, {
        method,
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

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Field label="Title">
        <input
          required
          className={inputClass}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </Field>
      <Field label="URL">
        <input
          required
          type="url"
          className={inputClass}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://"
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Source">
          <input
            className={inputClass}
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="Stratechery"
          />
        </Field>
        <Field label="Tag">
          <input
            className={inputClass}
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            placeholder="AI strategy"
          />
        </Field>
      </div>
      <Field label="Date published">
        <input
          required
          type="date"
          className={inputClass}
          value={dateRead}
          onChange={(e) => setDateRead(e.target.value)}
        />
      </Field>
      <Field label="Why I like it (one line)">
        <textarea
          required
          rows={2}
          className={inputClass}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
        />
      </Field>

      <div>
        <div className="text-xs uppercase tracking-wide text-muted mb-2">
          Quotes
        </div>
        <div className="flex flex-col gap-2">
          {quotes.map((q, i) => (
            <div key={i} className="flex items-start gap-2">
              <textarea
                rows={2}
                className={inputClass}
                value={q}
                onChange={(e) => updateQuote(i, e.target.value)}
                placeholder={`Quote ${i + 1}`}
              />
              <button
                type="button"
                onClick={() => removeQuote(i)}
                disabled={quotes.length === 1}
                className="shrink-0 text-xs text-muted hover:text-foreground transition-colors disabled:opacity-40 pt-2"
                aria-label="Remove quote"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addQuote}
            className="self-start text-xs underline decoration-rule underline-offset-4 hover:decoration-foreground mt-1"
          >
            + Add quote
          </button>
        </div>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={busy}
          className="border border-foreground bg-foreground text-background rounded-sm py-2 px-4 text-sm hover:opacity-80 transition-opacity disabled:opacity-50"
        >
          {busy ? "Saving…" : initial ? "Save changes" : "Publish"}
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

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs uppercase tracking-wide text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}
