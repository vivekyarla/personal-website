import "server-only";
import { supabaseAdmin } from "@/lib/supabase-admin";

export type Habit = {
  id: string;
  name: string;
  is_core: boolean;
  show_chart: boolean;
  reminder: string | null;
  position: number;
  created_at: string;
};

export type HabitEntry = {
  id: string;
  habit_id: string;
  date: string; // YYYY-MM-DD
  done: boolean;
};

const TZ = "America/Los_Angeles";

// Today's date as YYYY-MM-DD in Pacific Time (matches the site clock).
export function ptToday(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return parts; // en-CA yields YYYY-MM-DD
}

// Returns an array of YYYY-MM-DD for the last `n` days ending today (PT),
// oldest first.
export function lastNDates(n: number): string[] {
  const today = ptToday();
  const base = new Date(today + "T12:00:00Z");
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(base);
    d.setUTCDate(d.getUTCDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

// Grid date range: `weeksBack` weeks of history, then the full current week
// through Saturday. `weekStartIndex` marks this week's Sunday (used as the
// default scroll anchor); `todayIndex` marks today.
export function gridDateRange(weeksBack = 8): {
  dates: string[];
  weekStartIndex: number;
  todayIndex: number;
} {
  const today = ptToday();
  const todayDate = new Date(today + "T12:00:00Z");
  const dow = todayDate.getUTCDay(); // 0 = Sunday

  const sunday = new Date(todayDate);
  sunday.setUTCDate(sunday.getUTCDate() - dow);

  const start = new Date(sunday);
  start.setUTCDate(start.getUTCDate() - weeksBack * 7);

  const end = new Date(sunday);
  end.setUTCDate(end.getUTCDate() + 6); // Saturday of current week

  const dates: string[] = [];
  for (const d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    dates.push(d.toISOString().slice(0, 10));
  }

  const weekStartIndex = weeksBack * 7;
  const todayIndex = weekStartIndex + dow;
  return { dates, weekStartIndex, todayIndex };
}

export async function fetchHabits(): Promise<Habit[]> {
  const { data, error } = await supabaseAdmin
    .from("habits")
    .select("*")
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) {
    console.error("[habits] fetch:", error.message);
    return [];
  }
  return (data ?? []) as Habit[];
}

// All entries with done=true within [since, today].
export async function fetchEntriesSince(
  since: string
): Promise<HabitEntry[]> {
  const { data, error } = await supabaseAdmin
    .from("habit_entries")
    .select("id, habit_id, date, done")
    .gte("date", since)
    .eq("done", true);
  if (error) {
    console.error("[habits] entries fetch:", error.message);
    return [];
  }
  return (data ?? []) as HabitEntry[];
}
