"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Habit } from "@/lib/habits";

export default function HabitManager({ habits }: { habits: Habit[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [isCore, setIsCore] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const [reminder, setReminder] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          is_core: isCore,
          show_chart: showChart,
          reminder: reminder.trim() || null,
          position: habits.length,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "failed");
      }
      setName("");
      setIsCore(false);
      setShowChart(false);
      setReminder("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed");
    } finally {
      setBusy(false);
    }
  }

  async function del(id: string) {
    if (!confirm("Delete habit and all its history?")) return;
    await fetch(`/api/habits/${id}`, { method: "DELETE" });
    router.refresh();
  }

  async function patch(id: string, field: Partial<Habit>) {
    await fetch(`/api/habits/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(field),
    });
    router.refresh();
  }

  const inputClass =
    "w-full border border-rule rounded-sm py-2 px-3 text-sm bg-transparent focus:outline-none focus:border-foreground";

  return (
    <div className="flex flex-col gap-6">
      {habits.length > 0 && (
        <ul className="divide-y divide-rule">
          {habits.map((h) => (
            <li key={h.id} className="py-3 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="font-medium leading-tight">{h.name}</div>
                {h.reminder && (
                  <div className="text-[0.8rem] text-muted italic leading-snug mt-0.5">
                    {h.reminder}
                  </div>
                )}
                <div className="flex gap-3 mt-1.5 text-[0.72rem]">
                  <button
                    type="button"
                    onClick={() => patch(h.id, { is_core: !h.is_core })}
                    className={`underline-offset-2 ${
                      h.is_core ? "text-foreground underline" : "text-muted"
                    }`}
                  >
                    core
                  </button>
                  <button
                    type="button"
                    onClick={() => patch(h.id, { show_chart: !h.show_chart })}
                    className={`underline-offset-2 ${
                      h.show_chart ? "text-foreground underline" : "text-muted"
                    }`}
                  >
                    chart
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => del(h.id)}
                className="text-xs text-muted hover:text-red-600 transition-colors shrink-0"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={add} className="flex flex-col gap-3 border-t border-rule pt-6">
        <div className="text-xs uppercase tracking-wide text-muted">New habit</div>
        <input
          required
          placeholder="Habit name (e.g. Gym, Read, No phone in bed)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
        />
        <input
          placeholder="Reminder sentence (shown when missed)"
          value={reminder}
          onChange={(e) => setReminder(e.target.value)}
          className={inputClass}
        />
        <div className="flex gap-5 text-sm">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isCore}
              onChange={(e) => setIsCore(e.target.checked)}
              className="w-4 h-4 accent-foreground"
            />
            <span>Core (show in Today)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showChart}
              onChange={(e) => setShowChart(e.target.checked)}
              className="w-4 h-4 accent-foreground"
            />
            <span>Chart</span>
          </label>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={busy || name.trim().length === 0}
          className="self-start border border-foreground bg-foreground text-background rounded-sm py-2 px-4 text-sm hover:opacity-80 transition-opacity disabled:opacity-50"
        >
          {busy ? "…" : "Add habit"}
        </button>
      </form>
    </div>
  );
}
