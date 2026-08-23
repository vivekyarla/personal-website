import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/session";
import {
  fetchHabits,
  fetchEntriesSince,
  gridDateRange,
  ptToday,
} from "@/lib/habits";
import HabitTracker from "@/components/admin/HabitTracker";
import HabitManager from "@/components/admin/HabitManager";
import Collapsible from "@/components/Collapsible";

export const metadata = { title: "Admin · Habits" };
export const dynamic = "force-dynamic";

export default async function AdminHabits() {
  if (!(await requireAuth())) redirect("/admin/login");

  const { dates, weekStartIndex, todayIndex } = gridDateRange();
  const today = ptToday();
  const [habits, entries] = await Promise.all([
    fetchHabits(),
    fetchEntriesSince(dates[0]),
  ]);

  return (
    <div className="waterfall flex flex-col gap-10">
      <HabitTracker
        habits={habits}
        entries={entries}
        dates={dates}
        today={today}
        weekStartIndex={weekStartIndex}
        todayIndex={todayIndex}
      />

      <Collapsible title="Manage habits">
        <div className="pt-1">
          <HabitManager habits={habits} />
        </div>
      </Collapsible>
    </div>
  );
}
