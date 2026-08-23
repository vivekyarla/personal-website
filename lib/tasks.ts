import "server-only";
import { supabaseAdmin } from "@/lib/supabase-admin";

export type Task = {
  id: string;
  title: string;
  tag: string | null;
  due_date: string; // YYYY-MM-DD
  done: boolean;
  done_at: string | null;
  position: number;
  created_at: string;
};

const TZ = "America/Los_Angeles";

// Today's date as YYYY-MM-DD in Pacific Time (site convention, matches habits).
export function ptToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function addDays(iso: string, n: number): string {
  const d = new Date(iso + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

const HISTORY_DAYS = 14;

// The task window: today, tomorrow, and the remaining days of the current
// week (weeks run Sunday–Saturday, matching the habit grid). `week` may be
// empty (e.g. when today is Friday or Saturday). `historyStart` bounds the
// past-days history view.
export function taskWindow(): {
  today: string;
  tomorrow: string;
  week: string[];
  weekEnd: string;
  historyStart: string;
} {
  const today = ptToday();
  const tomorrow = addDays(today, 1);
  const dow = new Date(today + "T12:00:00Z").getUTCDay(); // 0 = Sunday
  const saturday = addDays(today, 6 - dow);
  const week: string[] = [];
  for (let d = addDays(tomorrow, 1); d <= saturday; d = addDays(d, 1)) {
    week.push(d);
  }
  // The visible window extends at least through tomorrow even when tomorrow
  // rolls into next week (today = Saturday).
  const weekEnd = week.length > 0 ? week[week.length - 1] : tomorrow;
  return { today, tomorrow, week, weekEnd, historyStart: addDays(today, -HISTORY_DAYS) };
}

// All tasks on the board: the visible window plus the trailing history days.
// Tasks never roll over — each day keeps its own record.
export async function fetchTasks(
  historyStart: string,
  weekEnd: string
): Promise<Task[]> {
  const { data, error } = await supabaseAdmin
    .from("tasks")
    .select("*")
    .gte("due_date", historyStart)
    .lte("due_date", weekEnd)
    .order("due_date", { ascending: true })
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) {
    console.error("[tasks] fetch:", error.message);
    return [];
  }
  return (data ?? []) as Task[];
}
