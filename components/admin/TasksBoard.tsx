"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Collapsible from "@/components/Collapsible";

export type Task = {
  id: string;
  title: string;
  tag: string | null;
  due_date: string;
  done: boolean;
  position: number;
};

export type CalEvent = {
  uid: string;
  title: string;
  originalTitle: string;
  dateKey: string;
  timeLabel: string | null;
  allDay: boolean;
};

type Props = {
  initialTasks: Task[];
  initialEvents: Record<string, CalEvent[]>;
  today: string;
  tomorrow: string;
  week: string[];
  historyDates: string[]; // past days that have tasks, newest first
  allTags: string[]; // every tag ever used (from the DB)
  calendarConfigured: boolean;
};

function fmtDay(iso: string, opts: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", ...opts }).format(
    new Date(iso + "T12:00:00Z")
  );
}

const byPos = (a: Task, b: Task) =>
  a.position - b.position || a.id.localeCompare(b.id);

export default function TasksBoard({
  initialTasks,
  initialEvents,
  today,
  tomorrow,
  week,
  historyDates,
  allTags,
  calendarConfigured,
}: Props) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [events, setEvents] = useState(initialEvents);
  const [newTaskSignal, setNewTaskSignal] = useState(0);
  const [dragging, setDragging] = useState(false);
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;
  const dragOrigin = useRef<{ id: string; date: string; pos: number } | null>(
    null
  );

  const knownTags = useMemo(() => {
    const s = new Set<string>(allTags);
    for (const t of tasks) if (t.tag) s.add(t.tag);
    return [...s].sort();
  }, [tasks, allTags]);

  // Keyboard: `n` opens a new-task row under Today (ignored while typing).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.tagName === "SELECT" ||
          t.isContentEditable)
      )
        return;
      if (e.key === "n") {
        e.preventDefault();
        setNewTaskSignal((s) => s + 1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Strict day buckets — tasks never roll over between days.
  function bucket(date: string): Task[] {
    return tasks.filter((t) => t.due_date === date).sort(byPos);
  }

  async function toggle(id: string) {
    const t = tasks.find((x) => x.id === id);
    if (!t) return;
    const done = !t.done;
    setTasks((prev) => prev.map((x) => (x.id === id ? { ...x, done } : x)));
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done }),
    }).catch(() =>
      setTasks((prev) =>
        prev.map((x) => (x.id === id ? { ...x, done: !done } : x))
      )
    );
  }

  async function del(id: string) {
    const prev = tasks;
    setTasks((p) => p.filter((x) => x.id !== id));
    const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" }).catch(
      () => null
    );
    if (!res?.ok) setTasks(prev);
  }

  async function add(due: string, title: string, tag: string) {
    const position = bucket(due).length;
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, tag: tag || null, due_date: due, position }),
    });
    if (res.ok) {
      const { task } = await res.json();
      setTasks((prev) => [...prev, task as Task]);
    }
  }

  async function renameEvent(uid: string, dateKey: string, title: string) {
    const list = events[dateKey] ?? [];
    const ev = list.find((e) => e.uid === uid);
    if (!ev) return;
    const finalTitle = title.trim() || ev.originalTitle;
    setEvents((prev) => ({
      ...prev,
      [dateKey]: (prev[dateKey] ?? []).map((e) =>
        e.uid === uid ? { ...e, title: finalTitle } : e
      ),
    }));
    await fetch("/api/calendar-override", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uid,
        custom_title: title.trim() === ev.originalTitle ? "" : title.trim(),
      }),
    });
  }

  /* ---- Cross-section drag & drop (one context over all main sections) ---- */

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } })
  );

  function overDateOf(overId: string): string | null {
    if (overId.startsWith("day:")) return overId.slice(4);
    return tasksRef.current.find((x) => x.id === overId)?.due_date ?? null;
  }

  function onDragStart(e: DragStartEvent) {
    const t = tasksRef.current.find((x) => x.id === String(e.active.id));
    if (t) dragOrigin.current = { id: t.id, date: t.due_date, pos: t.position };
    setDragging(true);
  }

  // While hovering over another day, move the task there optimistically so
  // the lists make room (fractional positions; normalized on drop).
  function onDragOver(e: DragOverEvent) {
    const { active, over } = e;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;
    setTasks((prev) => {
      const t = prev.find((x) => x.id === activeId);
      if (!t) return prev;
      const overDate = overId.startsWith("day:")
        ? overId.slice(4)
        : prev.find((x) => x.id === overId)?.due_date;
      if (!overDate || t.due_date === overDate) return prev;
      let pos: number;
      if (overId.startsWith("day:")) {
        const others = prev.filter(
          (x) => x.due_date === overDate && x.id !== activeId
        );
        pos = others.length
          ? Math.max(...others.map((x) => x.position)) + 1
          : 0;
      } else {
        pos = (prev.find((x) => x.id === overId)?.position ?? 0) - 0.5;
      }
      return prev.map((x) =>
        x.id === activeId ? { ...x, due_date: overDate, position: pos } : x
      );
    });
  }

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    const origin = dragOrigin.current;
    dragOrigin.current = null;
    setDragging(false);
    const activeId = String(active.id);

    if (!over || !origin) {
      // Cancelled / dropped outside — put it back where it started.
      if (origin) {
        setTasks((prev) =>
          prev.map((x) =>
            x.id === activeId
              ? { ...x, due_date: origin.date, position: origin.pos }
              : x
          )
        );
      }
      return;
    }

    const cur = tasksRef.current;
    const t = cur.find((x) => x.id === activeId);
    if (!t) return;
    const targetDate = t.due_date; // set by onDragOver (or unchanged)
    const overId = String(over.id);

    let targetList = cur.filter((x) => x.due_date === targetDate).sort(byPos);
    if (!overId.startsWith("day:") && overId !== activeId) {
      const o = cur.find((x) => x.id === overId);
      if (o && o.due_date === targetDate) {
        const oldIndex = targetList.findIndex((x) => x.id === activeId);
        const newIndex = targetList.findIndex((x) => x.id === overId);
        if (oldIndex >= 0 && newIndex >= 0) {
          targetList = arrayMove(targetList, oldIndex, newIndex);
        }
      }
    }

    // Normalize positions in target (and source if the task changed days).
    const posById = new Map(targetList.map((x, i) => [x.id, i]));
    let sourceIds: string[] = [];
    const dateChanged = origin.date !== targetDate;
    if (dateChanged) {
      const sourceList = cur
        .filter((x) => x.due_date === origin.date && x.id !== activeId)
        .sort(byPos);
      sourceList.forEach((x, i) => posById.set(x.id, i));
      sourceIds = sourceList.map((x) => x.id);
    }
    setTasks((prev) =>
      prev.map((x) =>
        posById.has(x.id) ? { ...x, position: posById.get(x.id)! } : x
      )
    );

    // Persist
    if (dateChanged) {
      fetch(`/api/tasks/${activeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ due_date: targetDate }),
      });
    }
    fetch("/api/tasks/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: targetList.map((x) => x.id) }),
    });
    if (sourceIds.length) {
      fetch("/api/tasks/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: sourceIds }),
      });
    }
  }

  const shared = {
    bucket,
    knownTags,
    dragging,
    onToggle: toggle,
    onDelete: del,
    onAdd: add,
  };

  return (
    <div className="flex flex-col gap-10">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        <DaySection
          label="Today"
          sub={fmtDay(today, { weekday: "long", month: "long", day: "numeric" })}
          dates={[today]}
          events={events[today] ?? []}
          focusSignal={newTaskSignal}
          showCalendar={calendarConfigured}
          onRenameEvent={renameEvent}
          {...shared}
        />
        <DaySection
          label="Tomorrow"
          sub={fmtDay(tomorrow, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
          dates={[tomorrow]}
          events={events[tomorrow] ?? []}
          showCalendar={calendarConfigured}
          onRenameEvent={renameEvent}
          {...shared}
        />
        {week.length > 0 && (
          <DaySection
            label="This week"
            sub={`${fmtDay(week[0], { weekday: "short", month: "short", day: "numeric" })} – ${fmtDay(week[week.length - 1], { weekday: "short", month: "short", day: "numeric" })}`}
            dates={week}
            events={[]}
            showCalendar={false}
            onRenameEvent={renameEvent}
            {...shared}
          />
        )}
      </DndContext>

      {historyDates.length > 0 && (
        <Collapsible title="History">
          <div className="flex flex-col gap-5 pt-1">
            {historyDates.map((d) => {
              const list = bucket(d);
              if (list.length === 0) return null;
              const doneCount = list.filter((t) => t.done).length;
              return (
                <div key={d}>
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-[0.68rem] uppercase tracking-wide text-muted/80">
                      {fmtDay(d, {
                        weekday: "long",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <span className="text-[0.68rem] text-muted/60 tabular-nums">
                      {doneCount}/{list.length}
                    </span>
                  </div>
                  <HistoryList
                    tasks={list}
                    onToggle={toggle}
                    onDelete={del}
                  />
                </div>
              );
            })}
          </div>
        </Collapsible>
      )}
    </div>
  );
}

/* ---------- Section ---------- */

function DaySection(props: {
  label: string;
  sub: string;
  dates: string[];
  events: CalEvent[];
  showCalendar: boolean;
  focusSignal?: number;
  bucket: (d: string) => Task[];
  knownTags: string[];
  dragging: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: (due: string, title: string, tag: string) => Promise<void>;
  onRenameEvent: (uid: string, dateKey: string, title: string) => void;
}) {
  const { label, sub, dates, events, dragging } = props;
  const multiDay = dates.length > 1;
  // Multi-day (This week): show only days that have tasks — except while
  // dragging, when every day appears as a drop target.
  const visibleDates = multiDay
    ? dates.filter((d) => dragging || props.bucket(d).length > 0)
    : dates;

  return (
    <section>
      <div className="flex items-baseline justify-between gap-3 mb-1.5">
        <h2 className="text-base font-semibold tracking-tight">{label}</h2>
        <span className="text-[0.72rem] text-muted/80 tabular-nums">{sub}</span>
      </div>
      <hr className="border-rule mb-3" />

      {props.showCalendar && (
        <CalendarList
          events={events}
          dateKey={dates[0]}
          onRename={props.onRenameEvent}
        />
      )}

      {multiDay ? (
        <>
          {visibleDates.map((d) => (
            <div key={d} className="mb-3 last:mb-1">
              <div className="text-[0.68rem] uppercase tracking-wide text-muted/80 mb-1">
                {fmtDay(d, { weekday: "long", month: "short", day: "numeric" })}
              </div>
              <DayList
                date={d}
                bucket={props.bucket}
                dragging={dragging}
                onToggle={props.onToggle}
                onDelete={props.onDelete}
              />
            </div>
          ))}
          <AddTaskRow
            dayOptions={dates}
            knownTags={props.knownTags}
            onAdd={props.onAdd}
          />
        </>
      ) : (
        <>
          <DayList
            date={dates[0]}
            bucket={props.bucket}
            dragging={dragging}
            onToggle={props.onToggle}
            onDelete={props.onDelete}
          />
          <AddTaskRow
            due={dates[0]}
            knownTags={props.knownTags}
            onAdd={props.onAdd}
            focusSignal={props.focusSignal}
          />
        </>
      )}
    </section>
  );
}

/* ---------- Calendar ---------- */

function CalendarList({
  events,
  dateKey,
  onRename,
}: {
  events: CalEvent[];
  dateKey: string;
  onRename: (uid: string, dateKey: string, title: string) => void;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  if (events.length === 0) return null;

  return (
    <ul className="mb-4 flex flex-col gap-1">
      {events.map((e) => (
        <li
          key={`${e.uid}-${e.timeLabel}`}
          className="flex items-baseline gap-2 leading-snug"
        >
          <span className="shrink-0 w-11 font-mono text-[0.72rem] text-muted tabular-nums">
            {e.allDay ? (
              <span className="text-[0.6rem] uppercase tracking-tight">
                All day
              </span>
            ) : (
              e.timeLabel
            )}
          </span>
          {editing === e.uid ? (
            <input
              autoFocus
              defaultValue={e.title}
              onChange={(ev) => setDraft(ev.target.value)}
              onKeyDown={(ev) => {
                if (ev.key === "Enter") {
                  onRename(e.uid, dateKey, draft);
                  setEditing(null);
                } else if (ev.key === "Escape") setEditing(null);
              }}
              onBlur={() => setEditing(null)}
              className="flex-1 min-w-0 bg-transparent text-[0.85rem] border-b border-rule focus:outline-none focus:border-foreground"
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                setDraft(e.title);
                setEditing(e.uid);
              }}
              title="Click to rename (local only)"
              className="text-left text-[0.85rem] text-muted hover:text-foreground transition-colors cursor-text min-w-0 truncate"
            >
              {e.title}
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

/* ---------- Droppable day list (shares the board's DndContext) ---------- */

function DayList({
  date,
  bucket,
  dragging,
  onToggle,
  onDelete,
}: {
  date: string;
  bucket: (d: string) => Task[];
  dragging: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const list = bucket(date);
  const { setNodeRef, isOver } = useDroppable({ id: `day:${date}` });

  return (
    <div ref={setNodeRef}>
      <SortableContext
        items={list.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul className="flex flex-col">
          {list.map((t) => (
            <TaskRow
              key={t.id}
              task={t}
              onToggle={() => onToggle(t.id)}
              onDelete={() => onDelete(t.id)}
            />
          ))}
        </ul>
      </SortableContext>
      {dragging && list.length === 0 && (
        <div
          className={`h-8 rounded-sm border border-dashed transition-colors ${
            isOver ? "border-foreground/60" : "border-rule"
          }`}
        />
      )}
    </div>
  );
}

/* ---------- History (isolated: reorder-only within its own day) ---------- */

function HistoryList({
  tasks,
  onToggle,
  onDelete,
}: {
  tasks: Task[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <ul className="flex flex-col">
      {tasks.map((t) => (
        <li
          key={t.id}
          className={`group flex items-start gap-2.5 py-1.5 ${t.done ? "task-done" : ""}`}
        >
          <TaskRowBody task={t} onToggle={() => onToggle(t.id)} onDelete={() => onDelete(t.id)} />
        </li>
      ))}
    </ul>
  );
}

/* ---------- Single task row ---------- */

function TaskRow({
  task: t,
  onToggle,
  onDelete,
}: {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: t.id });

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
      }}
      className={`group flex items-start gap-2.5 py-1.5 bg-background ${t.done ? "task-done" : ""}`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder or move to another day"
        className="shrink-0 text-muted/50 hover:text-foreground cursor-grab active:cursor-grabbing touch-none leading-none pt-1"
      >
        ⠿
      </button>
      <TaskRowBody task={t} onToggle={onToggle} onDelete={onDelete} />
    </li>
  );
}

function TaskRowBody({
  task: t,
  onToggle,
  onDelete,
}: {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={t.done}
        className={`shrink-0 mt-0.5 w-[18px] h-[18px] rounded-sm border flex items-center justify-center transition-colors ${
          t.done
            ? "bg-foreground border-foreground text-background task-check-on"
            : "border-rule hover:border-foreground/50"
        }`}
      >
        {t.done && (
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <path
              d="M2.5 6.5L5 9L9.5 3.5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>
      <div className="min-w-0 flex-1 leading-snug">
        <span className="task-title text-[0.9rem]">{t.title}</span>
        {t.tag && (
          <div className="mt-0.5 text-[0.68rem] uppercase tracking-wide text-muted/80">
            {t.tag}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={onDelete}
        aria-label="Delete task"
        className="shrink-0 pt-0.5 text-xs text-muted/0 group-hover:text-muted hover:!text-red-600 transition-colors"
      >
        ✕
      </button>
    </>
  );
}

/* ---------- Add row ---------- */

function AddTaskRow({
  due,
  dayOptions,
  knownTags,
  onAdd,
  focusSignal,
}: {
  due?: string;
  dayOptions?: string[]; // multi-day sections: pick the day from a select
  knownTags: string[];
  onAdd: (due: string, title: string, tag: string) => Promise<void>;
  focusSignal?: number;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [tag, setTag] = useState("");
  const [day, setDay] = useState(dayOptions?.[0] ?? due ?? "");
  const [busy, setBusy] = useState(false);

  const titleRef = useRef<HTMLInputElement>(null);

  // `n` shortcut: open this row and put the cursor in the title field
  // (re-focuses if it's already open).
  useEffect(() => {
    if (focusSignal && focusSignal > 0) {
      setOpen(true);
      requestAnimationFrame(() => titleRef.current?.focus());
    }
  }, [focusSignal]);

  async function submit() {
    const target = due ?? day;
    if (!title.trim() || !target || busy) return;
    setBusy(true);
    await onAdd(target, title.trim(), tag.trim());
    setTitle("");
    setBusy(false);
    // Rapid entry: cursor returns to the title field (tag + day stick around
    // so several tasks can share them).
    requestAnimationFrame(() => titleRef.current?.focus());
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="self-start py-1 text-[0.8rem] text-muted/70 hover:text-foreground transition-colors"
      >
        + Add task
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 py-1.5">
      <span
        aria-hidden
        className="w-[18px] shrink-0 border border-rule rounded-sm h-[18px] opacity-40"
      />
      <input
        ref={titleRef}
        autoFocus
        placeholder="Task"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          if (e.key === "Escape") setOpen(false);
        }}
        className="flex-1 min-w-0 bg-transparent text-[0.9rem] border-b border-rule focus:outline-none focus:border-foreground py-0.5"
      />
      <input
        placeholder="tag"
        value={tag}
        list="task-tags"
        onChange={(e) => setTag(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          if (e.key === "Escape") setOpen(false);
        }}
        className="w-24 bg-transparent text-[0.8rem] border-b border-rule focus:outline-none focus:border-foreground py-0.5"
      />
      {dayOptions && (
        <select
          value={day}
          onChange={(e) => setDay(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
            if (e.key === "Escape") setOpen(false);
          }}
          className="bg-transparent text-[0.8rem] text-muted border-b border-rule focus:outline-none focus:border-foreground py-0.5 cursor-pointer"
        >
          {dayOptions.map((d) => (
            <option key={d} value={d}>
              {fmtDay(d, { weekday: "short", month: "short", day: "numeric" })}
            </option>
          ))}
        </select>
      )}
      <datalist id="task-tags">
        {knownTags.map((t) => (
          <option key={t} value={t} />
        ))}
      </datalist>
      <button
        type="button"
        onClick={submit}
        disabled={busy || !title.trim()}
        className="text-[0.8rem] text-muted hover:text-foreground transition-colors disabled:opacity-40"
      >
        {busy ? "…" : "Add"}
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        aria-label="Close"
        className="text-xs text-muted/60 hover:text-foreground transition-colors"
      >
        ✕
      </button>
    </div>
  );
}
