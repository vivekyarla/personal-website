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
