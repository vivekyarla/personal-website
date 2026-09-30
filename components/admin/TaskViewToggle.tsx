"use client";

import { setTaskView, useTaskView, type TaskView } from "@/components/admin/taskView";

const OPTIONS: { value: TaskView; label: string }[] = [
  { value: "day", label: "Day" },
  { value: "label", label: "Label" },
];

// Day · Label switch beside the Tasks heading (also `g`). Active option gets
// the switcher's hairline underline.
export default function TaskViewToggle() {
  const view = useTaskView();
  return (
    <div
      role="group"
      aria-label="Task view"
      title="Press g to switch"
      className="flex items-baseline gap-3 text-[0.72rem]"
    >
      {OPTIONS.map((o) => {
        const active = view === o.value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            onClick={() => setTaskView(o.value)}
            className={`relative pb-0.5 tracking-tight transition-colors ${
              active ? "text-foreground" : "text-muted hover:text-foreground"
            }`}
          >
            {o.label}
            <span
              aria-hidden
              className={`absolute inset-x-0 -bottom-px h-px bg-foreground transition-opacity duration-300 ${
                active ? "opacity-100" : "opacity-0"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}
