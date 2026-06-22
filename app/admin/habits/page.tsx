import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/session";
import {
  fetchHabits,
  fetchEntriesSince,
  lastNDates,
  ptToday,
} from "@/lib/habits";
import HabitTracker from "@/components/admin/HabitTracker";
import HabitManager from "@/components/admin/HabitManager";
import Collapsible from "@/components/Collapsible";

export const metadata = { title: "Admin · Habits" };
export const dynamic = "force-dynamic";

const GRID_DAYS = 30;

export default async function AdminHabits() {
  if (!(await requireAuth())) redirect("/admin/login");

  const dates = lastNDates(GRID_DAYS);
  const today = ptToday();
  const [habits, entries] = await Promise.all([
    fetchHabits(),
    fetchEntriesSince(dates[0]),
  ]);

  return (
    <div className="flex flex-col gap-10">
      <div>
        <Link
          href="/admin"
          className="text-xs text-muted/70 hover:text-foreground transition-colors"
        >
          ← admin
        </Link>
      </div>

      <HabitTracker
        habits={habits}
        entries={entries}
        dates={dates}
        today={today}
      />

      <Collapsible title="Manage habits">
        <div className="pt-1">
          <HabitManager habits={habits} />
        </div>
      </Collapsible>
    </div>
  );
}
