"use client";

import { useSyncExternalStore } from "react";

// Tasks board view: "day" (one list per day) or "label" (each day split into
// All / Rox / McK). Remembered per browser; shared between the header toggle
// and the board.
export type TaskView = "day" | "label";

const KEY = "tasks.view";
const listeners = new Set<() => void>();
let current: TaskView | null = null;

function read(): TaskView {
  try {
    return localStorage.getItem(KEY) === "label" ? "label" : "day";
  } catch {
    return "day";
  }
}

export function setTaskView(v: TaskView) {
  try {
    localStorage.setItem(KEY, v);
  } catch {
    // Private mode etc. — the switch still works for this page view.
  }
  current = v;
  listeners.forEach((l) => l());
}

export function useTaskView(): TaskView {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
    () => (current ??= read()),
    () => "day"
  );
}

export function toggleTaskView() {
  setTaskView((current ?? read()) === "day" ? "label" : "day");
}
