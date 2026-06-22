"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Habit } from "@/lib/habits";

export default function HabitManager({ habits }: { habits: Habit[] }) {
  const router = useRouter();
  const [order, setOrder] = useState<Habit[]>(habits);
  const [name, setName] = useState("");
  const [isCore, setIsCore] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const [reminder, setReminder] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep local order in sync when server data changes.
  useEffect(() => setOrder(habits), [habits]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 6 },
    })
  );

  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = order.findIndex((h) => h.id === active.id);
    const newIndex = order.findIndex((h) => h.id === over.id);
    const next = arrayMove(order, oldIndex, newIndex);
    setOrder(next);
    await fetch("/api/habits/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: next.map((h) => h.id) }),
    });
    router.refresh();
  }

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
          position: order.length,
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
      {order.length > 0 && (
        <>
          <p className="text-[0.75rem] text-muted/70">
            Drag to reorder by priority — the top unchecked core habit drives
            today&apos;s reminder.
          </p>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragEnd}
          >
            <SortableContext
              items={order.map((h) => h.id)}
              strategy={verticalListSortingStrategy}
            >
              <ul className="divide-y divide-rule">
                {order.map((h) => (
                  <SortableRow
                    key={h.id}
                    habit={h}
                    onDelete={() => del(h.id)}
                    onToggleCore={() => patch(h.id, { is_core: !h.is_core })}
                    onToggleChart={() => patch(h.id, { show_chart: !h.show_chart })}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        </>
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

function SortableRow({
  habit: h,
  onDelete,
  onToggleCore,
  onToggleChart,
}: {
  habit: Habit;
  onDelete: () => void;
  onToggleCore: () => void;
  onToggleChart: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: h.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="py-3 flex items-start justify-between gap-3 bg-background"
    >
      <div className="flex items-start gap-2 min-w-0">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
          className="shrink-0 text-muted/60 hover:text-foreground cursor-grab active:cursor-grabbing touch-none pt-0.5 leading-none"
        >
          ⠿
        </button>
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
              onClick={onToggleCore}
              className={`underline-offset-2 ${
                h.is_core ? "text-foreground underline" : "text-muted"
              }`}
            >
              core
            </button>
            <button
              type="button"
              onClick={onToggleChart}
              className={`underline-offset-2 ${
                h.show_chart ? "text-foreground underline" : "text-muted"
              }`}
            >
              chart
            </button>
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={onDelete}
        className="text-xs text-muted hover:text-red-600 transition-colors shrink-0"
      >
        Delete
      </button>
    </li>
  );
}
