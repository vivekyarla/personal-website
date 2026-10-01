"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import {
  DndContext,
  DragOverlay,
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
import Link from "next/link";
import Collapsible from "@/components/Collapsible";
import { useCalendarPolling } from "@/components/admin/useCalendarPolling";
import {
  eventEndMs,
  eventKey,
  patchOverrides,
  resolveEvents,
  type CalendarData,
  type ShownEvent,
} from "@/lib/calendar-overrides";

export type Task = {
  id: string;
  title: string;
  tag: string | null;
  due_date: string;
  done: boolean;
  position: number;
  // Label view: the tag a task had before being dragged into Rox/McK, restored
  // when it's dragged back into All.
  prev_tag?: string | null;
};

// Override patch for one calendar event: `scope` "series" hits every
// occurrence, "day" just this one.
type EventPatch = {
  custom_title?: string | null;
  hidden?: boolean;
};
type OnEventOverride = (
  e: ShownEvent,
  scope: "series" | "day",
  patch: EventPatch
) => void;

type Props = {
  initialTasks: Task[];
  initialCalendar: CalendarData;
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

const noopSubscribe = () => () => {};

/* ---- Label view: each day split into All / Rox / McK ---- */

type Group = "all" | "rox" | "mck";
const GROUPS: { key: Group; label: string }[] = [
  { key: "all", label: "All" },
  { key: "rox", label: "Rox" },
  { key: "mck", label: "McK" },
];
const DEFAULT_SPELLING: Record<Group, string> = { all: "", rox: "Rox", mck: "McK" };

// Rox/McK match any capitalization; every other tag (or none) is All.
function groupOf(tag: string | null): Group {
  const t = tag?.trim().toLowerCase();
  return t === "rox" || t === "mck" ? t : "all";
}

export default function TasksBoard({
  initialTasks,
  initialCalendar,
  today,
  tomorrow,
  week,
  historyDates,
  allTags,
  calendarConfigured,
}: Props) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [calendar, setCalendar] = useState(initialCalendar);
  // Bumped on every local rename/hide; a poll that started before the latest
  // edit (or while one is in flight) keeps the local overrides.
  const overrideSeq = useRef(0);
  const overridesInFlight = useRef(0);
  const [newTaskSignal, setNewTaskSignal] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;
  const dragOrigin = useRef<{
    id: string;
    date: string;
    pos: number;
    tag: string | null;
    prev_tag: string | null;
  } | null>(null);
  // Client clock for fading today's finished events (null until mounted so
  // server and client render the same).
  const [nowMs, setNowMs] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNowMs(Date.now());
    const first = window.setTimeout(tick, 0);
    const id = window.setInterval(tick, 30 * 1000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, []);
  // Client-only flag for the drag overlay portal (no document during SSR).
  const mounted = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
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

  // Drag/drop container: day + group for current days, e.g.
  // "2026-10-01#rox"; just the day for history (which stays a plain list).
  function containerOf(t: Task): string {
    return t.due_date >= today
      ? `${t.due_date}#${groupOf(t.tag)}`
      : t.due_date;
  }
  function bucketIn(container: string): Task[] {
    return tasks.filter((t) => containerOf(t) === container).sort(byPos);
  }

  // Tag change for moving a task into group `g`: into Rox/McK remembers the
  // All tag it came from; back into All restores it.
  function retag(t: Task, g: Group): Pick<Task, "tag" | "prev_tag"> {
    const from = groupOf(t.tag);
    if (from === g) return { tag: t.tag, prev_tag: t.prev_tag ?? null };
    if (g === "all") return { tag: t.prev_tag ?? null, prev_tag: null };
    return {
      tag: DEFAULT_SPELLING[g],
      prev_tag: from === "all" ? t.tag : (t.prev_tag ?? null),
    };
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

  /* ---- Calendar: live refresh + local renames/hides ---- */

  useCalendarPolling(calendarConfigured, [today, tomorrow], () => {
    const seqAtStart = overrideSeq.current;
    return (fresh) => {
      const keepLocal =
        overridesInFlight.current > 0 || overrideSeq.current !== seqAtStart;
      setCalendar((prev) => ({
        events: fresh.events,
        overrides: keepLocal ? prev.overrides : fresh.overrides,
      }));
    };
  });

  const overrideEvent: OnEventOverride = async (e, scope, patch) => {
    const dateKey = scope === "day" ? e.dateKey : "";
    const before = calendar.overrides;
    overrideSeq.current++;
    overridesInFlight.current++;
    setCalendar((prev) => ({
      ...prev,
      overrides: patchOverrides(prev.overrides, e.uid, dateKey, patch),
    }));
    const res = await fetch("/api/calendar-override", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid: e.uid, date_key: dateKey, ...patch }),
    }).catch(() => null);
    overridesInFlight.current--;
    if (!res?.ok) {
      // Didn't persist — put it back so the screen never lies.
      overrideSeq.current++;
      setCalendar((prev) => ({ ...prev, overrides: before }));
    }
  };

  const shownEvents = useMemo(() => {
    const out: Record<string, ShownEvent[]> = {};
    for (const [d, list] of Object.entries(calendar.events)) {
      out[d] = resolveEvents(list, calendar.overrides);
    }
    return out;
  }, [calendar]);

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
    if (t) {
      dragOrigin.current = {
        id: t.id,
        date: t.due_date,
        pos: t.position,
        tag: t.tag,
        prev_tag: t.prev_tag ?? null,
      };
      setActiveTask(t);
    }
    setDragging(true);
  }

  // Put the dragged task back exactly as it started.
  function restoreOrigin() {
    const origin = dragOrigin.current;
    dragOrigin.current = null;
    setDragging(false);
    setActiveTask(null);
    if (origin) {
      setTasks((prev) =>
        prev.map((x) =>
          x.id === origin.id
            ? {
                ...x,
                due_date: origin.date,
                position: origin.pos,
                tag: origin.tag,
                prev_tag: origin.prev_tag,
              }
            : x
        )
      );
    }
  }

  function onDragCancel() {
    restoreOrigin();
  }

  // While hovering over another day or group, move
  // the task there optimistically so the lists make room (fractional
  // positions; normalized on drop). Entering a group retags the task.
  function onDragOver(e: DragOverEvent) {
    const { active, over } = e;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;
    setTasks((prev) => {
      const t = prev.find((x) => x.id === activeId);
      if (!t) return prev;
      const onContainer = overId.startsWith("day:");
      const overTask = onContainer ? null : prev.find((x) => x.id === overId);
      const overC = onContainer
        ? overId.slice(4)
        : overTask && containerOf(overTask);
      if (!overC || containerOf(t) === overC) return prev;
      const [overDate, overGroup] = overC.split("#") as [string, Group?];
      // One-way street: tasks can leave history but never enter the past.
      if (overDate < today) return prev;
      let pos: number;
      if (onContainer) {
        const others = prev.filter(
          (x) => x.id !== activeId && containerOf(x) === overC
        );
        const sameDay = prev.filter(
          (x) => x.id !== activeId && x.due_date === overDate
        );
        pos = others.length
          ? Math.max(...others.map((x) => x.position)) + 0.5
          : sameDay.length
            ? Math.max(...sameDay.map((x) => x.position)) + 1
            : 0;
      } else {
        pos = (overTask?.position ?? 0) - 0.5;
      }
      const tagPatch = overGroup ? retag(t, overGroup) : {};
      return prev.map((x) =>
        x.id === activeId
          ? { ...x, due_date: overDate, position: pos, ...tagPatch }
          : x
      );
    });
  }

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    const origin = dragOrigin.current;
    const activeId = String(active.id);

    if (!over || !origin) {
      // Cancelled / dropped outside — put it back where it started.
      restoreOrigin();
      return;
    }
    dragOrigin.current = null;
    setDragging(false);
    setActiveTask(null);

    const cur = tasksRef.current;
    const t = cur.find((x) => x.id === activeId);
    if (!t) return;
    const targetDate = t.due_date; // set by onDragOver (or unchanged)
    const targetC = containerOf(t);
    const overId = String(over.id);

    let targetList = cur.filter((x) => containerOf(x) === targetC).sort(byPos);
    if (!overId.startsWith("day:") && overId !== activeId) {
      const o = cur.find((x) => x.id === overId);
      if (o && containerOf(o) === targetC) {
        const oldIndex = targetList.findIndex((x) => x.id === activeId);
        const newIndex = targetList.findIndex((x) => x.id === overId);
        if (oldIndex >= 0 && newIndex >= 0) {
          targetList = arrayMove(targetList, oldIndex, newIndex);
        }
      }
    }

    // Days keep one ordering across views: write the container's new order
    // back into the slots its tasks occupy in the day.
    let gi = 0;
    const dayOrder = cur
      .filter((x) => x.due_date === targetDate)
      .sort(byPos)
      .map((x) => (containerOf(x) === targetC ? targetList[gi++] : x));

    // Normalize positions in the target day (and the source day if it changed).
    const posById = new Map(dayOrder.map((x, i) => [x.id, i]));
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
    const patch: Record<string, unknown> = {};
    if (dateChanged) patch.due_date = targetDate;
    if (t.tag !== origin.tag) {
      patch.tag = t.tag;
      patch.prev_tag = t.prev_tag ?? null;
    }
    if (Object.keys(patch).length) {
      fetch(`/api/tasks/${activeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
    }
    fetch("/api/tasks/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: dayOrder.map((x) => x.id) }),
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
    bucketIn,
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
        onDragCancel={onDragCancel}
      >
        <DaySection
          label="Today"
          sub={fmtDay(today, { weekday: "long", month: "long", day: "numeric" })}
          dates={[today]}
          events={shownEvents[today] ?? []}
          nowMs={nowMs}
          focusSignal={newTaskSignal}
          showCalendar={calendarConfigured}
          onEventOverride={overrideEvent}
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
          events={shownEvents[tomorrow] ?? []}
          showCalendar={calendarConfigured}
          onEventOverride={overrideEvent}
          {...shared}
        />
        {week.length > 0 && (
          <DaySection
            label="This week"
            sub={`${fmtDay(week[0], { weekday: "short", month: "short", day: "numeric" })} – ${fmtDay(week[week.length - 1], { weekday: "short", month: "short", day: "numeric" })}`}
            dates={week}
            events={[]}
            showCalendar={false}
            onEventOverride={overrideEvent}
            {...shared}
          />
        )}

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
                    <DayList
                      id={d}
                      list={list}
                      dragging={false}
                      onToggle={toggle}
                      onDelete={del}
                    />
                  </div>
                );
              })}
            </div>
          </Collapsible>
        )}

        {/* Dragged row portaled to <body>: the page's .waterfall animation
            leaves a transform on our ancestor, which would make the overlay's
            position:fixed relative to it — offsetting the drag's collision
            rect (drops landed a group/row low). Also keeps it from being
            clipped when pulled out of the History collapsible. */}
        {mounted &&
          createPortal(
            <DragOverlay>
              {activeTask ? (
                <div
                  className={`flex items-start gap-2.5 py-1.5 bg-background ${
                    activeTask.done ? "task-done" : ""
                  }`}
                >
                  <span
                    aria-hidden
                    className="shrink-0 text-muted/50 leading-none pt-1"
                  >
                    ⠿
                  </span>
                  <TaskRowBody
                    task={activeTask}
                    hideTag={
                      activeTask.due_date >= today &&
                      groupOf(activeTask.tag) !== "all"
                    }
                    onToggle={() => {}}
                    onDelete={() => {}}
                  />
                </div>
              ) : null}
            </DragOverlay>,
            document.body
          )}
      </DndContext>
    </div>
  );
}

/* ---------- Section ---------- */

function DaySection(props: {
  label: string;
  sub: string;
  dates: string[];
  events: ShownEvent[];
  showCalendar: boolean;
  focusSignal?: number;
  bucket: (d: string) => Task[];
  bucketIn: (container: string) => Task[];
  knownTags: string[];
  dragging: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: (due: string, title: string, tag: string) => Promise<void>;
  onEventOverride: OnEventOverride;
  nowMs?: number | null; // Today only: fades events that have ended
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
          nowMs={props.nowMs ?? null}
          onOverride={props.onEventOverride}
        />
      )}

      {multiDay ? (
        <>
          {visibleDates.map((d) => (
            <div key={d} className="mb-3 last:mb-1">
              <div className="text-[0.68rem] uppercase tracking-wide text-muted/80 mb-1">
                {fmtDay(d, { weekday: "long", month: "short", day: "numeric" })}
              </div>
              <DayTasks date={d} {...props} />
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
          <DayTasks date={dates[0]} {...props} />
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

// Renames/hides are local to this site — Google Calendar is never touched.
// Hidden events collapse into an "N hidden" toggle so they can be restored.
function CalendarList({
  events,
  nowMs,
  onOverride,
}: {
  events: ShownEvent[];
  nowMs: number | null;
  onOverride: OnEventOverride;
}) {
  const [showHidden, setShowHidden] = useState(false);

  if (events.length === 0) return null;
  const visible = events.filter((e) => !e.hiddenBy);
  const hidden = events.filter((e) => e.hiddenBy);
  const key = (e: ShownEvent) =>
    `${e.uid}|${e.dateKey}|${e.timeLabel ?? "allday"}`;

  return (
    <div className="mb-4">
      {visible.length > 0 && (
        <ul className="flex flex-col gap-1">
          {visible.map((e) => (
            <CalendarRow
              key={key(e)}
              event={e}
              past={nowMs !== null && !e.allDay && eventEndMs(e) <= nowMs}
              onOverride={onOverride}
            />
          ))}
        </ul>
      )}
      {hidden.length > 0 && (
        <div className={visible.length > 0 ? "mt-1.5" : ""}>
          <button
            type="button"
            onClick={() => setShowHidden((s) => !s)}
            aria-expanded={showHidden}
            className="text-[0.68rem] text-muted/60 hover:text-foreground transition-colors tabular-nums"
          >
            {hidden.length} hidden {showHidden ? "▴" : "▾"}
          </button>
          {showHidden && (
            <ul className="mt-1 flex flex-col gap-1">
              {hidden.map((e) => (
                <li key={key(e)} className="flex items-baseline gap-2 leading-snug">
                  <EventTime event={e} />
                  <span className="min-w-0 truncate text-[0.85rem] text-muted/50 line-through decoration-rule">
                    {e.displayTitle}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      onOverride(e, e.hiddenBy === "day" ? "day" : "series", {
                        hidden: false,
                      })
                    }
                    className="ml-auto shrink-0 text-[0.68rem] text-muted hover:text-foreground transition-colors"
                  >
                    Show{e.hiddenBy === "series" && e.recurring ? " all" : ""}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// "19:00" -> "7:00". A leading figure space keeps colons aligned in the
// mono column ("\u20077:00" over "10:30").
function fmtTime(label: string | null): string {
  if (!label) return "";
  const [h, m] = label.split(":").map(Number);
  const h12 = h % 12 || 12;
  return `${h12 < 10 ? "\u2007" : ""}${h12}:${String(m).padStart(2, "0")}`;
}

function EventTime({
  event: e,
  past = false,
}: {
  event: ShownEvent;
  past?: boolean;
}) {
  return (
    <span
      className={`shrink-0 w-11 font-mono text-[0.72rem] tabular-nums transition-colors duration-500 ${
        past ? "text-muted/45" : "text-muted"
      }`}
    >
      {e.allDay ? (
        <span className="text-[0.6rem] uppercase tracking-tight">All day</span>
      ) : (
        fmtTime(e.timeLabel)
      )}
    </span>
  );
}

// Keep focus in the rename input when tapping its inline controls.
const keepFocus = (ev: React.SyntheticEvent) => ev.preventDefault();

function CalendarRow({
  event: e,
  past = false,
  onOverride,
}: {
  event: ShownEvent;
  past?: boolean; // ended (Today only) — shown faded
  onOverride: OnEventOverride;
}) {
  const [mode, setMode] = useState<"view" | "edit" | "hide">("view");
  const [draft, setDraft] = useState("");
  // Recurring events: rename every occurrence unless this day already has its
  // own name.
  const [scope, setScope] = useState<"series" | "day">("series");
  const settled = useRef(false);

  function startEdit() {
    setDraft(e.displayTitle);
    setScope(e.renamedAt === "day" ? "day" : "series");
    settled.current = false;
    setMode("edit");
  }

  // Enter and blur both save; Escape cancels. Clearing the text (or typing
  // the original name) restores Google's title.
  function finishEdit(save: boolean) {
    if (settled.current) return;
    settled.current = true;
    setMode("view");
    const next = draft.trim();
    if (!save || next === e.displayTitle) return;
    onOverride(e, e.recurring ? scope : "series", {
      custom_title: next && next !== e.title ? next : null,
    });
  }

  function hide(s: "series" | "day") {
    setMode("view");
    onOverride(e, s, { hidden: true });
  }

  const inline =
    "shrink-0 text-[0.68rem] text-muted hover:text-foreground transition-colors";
  // Hover-revealed row actions (always faintly visible on touch screens).
  const rowIcon =
    "-my-1 p-1 leading-none text-muted/0 group-hover:text-muted focus-visible:text-muted hover:!text-foreground [@media(hover:none)]:text-muted/50 transition-colors";

  return (
    <li className="group flex items-baseline gap-2 leading-snug">
      <EventTime event={e} past={past} />
      {mode === "edit" ? (
        <>
          <input
            autoFocus
            onFocus={(ev) => ev.currentTarget.select()}
            value={draft}
            onChange={(ev) => setDraft(ev.target.value)}
            onKeyDown={(ev) => {
              if (ev.key === "Enter") finishEdit(true);
              else if (ev.key === "Escape") finishEdit(false);
            }}
            onBlur={() => finishEdit(true)}
            placeholder={e.title}
            aria-label="Rename event on this site (clear to reset)"
            className="flex-1 min-w-0 bg-transparent text-[0.85rem] border-b border-rule focus:outline-none focus:border-foreground"
          />
          {e.recurring && (
            <button
              type="button"
              onMouseDown={keepFocus}
              onPointerDown={keepFocus}
              onClick={() => setScope((s) => (s === "series" ? "day" : "series"))}
              title="Rename every occurrence, or just this day"
              className={`${inline} border-b border-dotted border-rule`}
            >
              {scope === "series" ? "every time" : "this day only"}
            </button>
          )}
        </>
      ) : mode === "hide" ? (
        <>
          <span className="min-w-0 truncate text-[0.85rem] text-muted/50">
            {e.displayTitle}
          </span>
          <span className="ml-auto flex shrink-0 items-baseline gap-2">
            <span className="text-[0.68rem] text-muted/60">Hide</span>
            <button type="button" onClick={() => hide("day")} className={inline}>
              this day
            </button>
            <span className="text-[0.68rem] text-muted/40">·</span>
            <button type="button" onClick={() => hide("series")} className={inline}>
              every time
            </button>
            <span className="text-[0.68rem] text-muted/40">·</span>
            <button type="button" onClick={() => setMode("view")} className={inline}>
              cancel
            </button>
          </span>
        </>
      ) : (
        <>
          <Link
            href={`/admin/calendar?focus=${encodeURIComponent(eventKey(e))}`}
            title={
              e.renamed
                ? `Originally “${e.title}” — open in calendar`
                : "Open in calendar"
            }
            className={`min-w-0 truncate text-[0.85rem] underline-offset-4 decoration-foreground/40 transition-colors duration-500 hover:text-foreground hover:underline ${
              past ? "text-muted/45" : "text-muted"
            }`}
          >
            {e.displayTitle}
          </Link>
          <span className="ml-auto flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              onClick={startEdit}
              aria-label="Rename event on this site"
              title="Rename (this site only)"
              className={rowIcon}
            >
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
                <path
                  d="M8.2 1.8l2 2L4 10H2v-2l6.2-6.2z"
                  stroke="currentColor"
                  strokeWidth="1.1"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => (e.recurring ? setMode("hide") : hide("series"))}
              aria-label="Hide event on this site"
              title="Hide on this site (Google Calendar is unchanged)"
              className={`${rowIcon} text-xs`}
            >
              ✕
            </button>
          </span>
        </>
      )}
    </li>
  );
}

/* ---------- Droppable day list (shares the board's DndContext) ---------- */

// One day's tasks as All / Rox / McK groups, in that order. Empty groups
// hide except while dragging (as drop targets).
function DayTasks({
  date,
  bucketIn,
  dragging,
  onToggle,
  onDelete,
}: {
  date: string;
  bucketIn: (container: string) => Task[];
  dragging: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      {GROUPS.map((g) => {
        const id = `${date}#${g.key}`;
        const list = bucketIn(id);
        if (list.length === 0 && !dragging) return null;
        const done = list.filter((t) => t.done).length;
        return (
          <div key={g.key}>
            <div className="flex items-baseline justify-between">
              <span className="text-[0.62rem] uppercase tracking-wide text-muted/80">
                {g.label}
              </span>
              {list.length > 0 && (
                <span className="text-[0.62rem] text-muted/60 tabular-nums">
                  {done}/{list.length}
                </span>
              )}
            </div>
            <DayList
              id={id}
              list={list}
              dragging={dragging}
              hideTag={g.key !== "all"}
              onToggle={onToggle}
              onDelete={onDelete}
            />
          </div>
        );
      })}
    </div>
  );
}

function DayList({
  id,
  list,
  dragging,
  hideTag = false,
  onToggle,
  onDelete,
}: {
  id: string; // date#group, or a date (history)
  list: Task[];
  dragging: boolean;
  hideTag?: boolean; // group heading already says Rox/McK
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `day:${id}` });

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
              hideTag={hideTag}
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

/* ---------- Single task row ---------- */

function TaskRow({
  task: t,
  hideTag,
  onToggle,
  onDelete,
}: {
  task: Task;
  hideTag?: boolean;
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
        // The DragOverlay carries the visual; fade the in-list original.
        opacity: isDragging ? 0.3 : 1,
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
      <TaskRowBody
        task={t}
        hideTag={hideTag}
        onToggle={onToggle}
        onDelete={onDelete}
      />
    </li>
  );
}

function TaskRowBody({
  task: t,
  hideTag,
  onToggle,
  onDelete,
}: {
  task: Task;
  hideTag?: boolean;
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
        {t.tag && !hideTag && (
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
    // Collapse back to "+ Add task" with fresh fields for next time.
    setTitle("");
    setTag("");
    setBusy(false);
    setOpen(false);
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
