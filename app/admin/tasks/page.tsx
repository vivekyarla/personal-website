import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/session";
import { fetchTasks, taskWindow } from "@/lib/tasks";
import { fetchCalendarEvents, calendarConfigured } from "@/lib/calendar";
import TasksBoard from "@/components/admin/TasksBoard";

export const metadata = { title: "Admin · Tasks" };
export const dynamic = "force-dynamic";

export default async function AdminTasks() {
  if (!(await requireAuth())) redirect("/admin/login");

  const { today, tomorrow, week, weekEnd, historyStart } = taskWindow();
  const [tasks, events] = await Promise.all([
    fetchTasks(historyStart, weekEnd),
    fetchCalendarEvents([today, tomorrow]),
  ]);

  const historyDates = [
    ...new Set(tasks.filter((t) => t.due_date < today).map((t) => t.due_date)),
  ]
    .sort()
    .reverse();

  const hasCalendar = calendarConfigured();

  return (
    <div className="waterfall flex flex-col gap-8">
      <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>

      {!hasCalendar && (
        <p className="text-[0.8rem] text-muted/80 italic">
          Calendar not connected — set GCAL_ICS_URLS to your Google Calendar
          secret iCal address to see events under Today and Tomorrow.
        </p>
      )}

      <TasksBoard
        initialTasks={tasks}
        initialEvents={events}
        today={today}
        tomorrow={tomorrow}
        week={week}
        historyDates={historyDates}
        calendarConfigured={hasCalendar}
      />
    </div>
  );
}
