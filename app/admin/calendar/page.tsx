import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/session";
import { addDays, ptToday } from "@/lib/tasks";
import { fetchCalendar, calendarConfigured } from "@/lib/calendar";
import WeekCalendar from "@/components/admin/WeekCalendar";

export const metadata = { title: "Admin · Calendar" };
export const dynamic = "force-dynamic";

export default async function AdminCalendar() {
  if (!(await requireAuth())) redirect("/admin/login");

  // Weeks run Sunday–Saturday (matches tasks + the habit grid).
  const today = ptToday();
  const dow = new Date(today + "T12:00:00Z").getUTCDay();
  const weekStart = addDays(today, -dow);
  const dates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const hasCalendar = calendarConfigured();
  const calendar = await fetchCalendar(hasCalendar ? dates : []);

  return (
    <div className="waterfall flex flex-col gap-6">
      <WeekCalendar
        today={today}
        initialWeekStart={weekStart}
        initialCalendar={calendar}
        configured={hasCalendar}
      />
    </div>
  );
}
