import { redirect } from "next/navigation";
import { requireAuthOrAgentSession } from "@/lib/session";
import { fetchAllTags, fetchTasks, taskWindow } from "@/lib/tasks";
import { fetchCalendar, calendarConfigured } from "@/lib/calendar";
import TasksBoard from "@/components/admin/TasksBoard";

export const metadata = { title: "Admin · Tasks" };
export const dynamic = "force-dynamic";

export default async function AdminTasks() {
  if (!(await requireAuthOrAgentSession())) redirect("/admin/login");

  const { today, tomorrow, week, weekEnd, historyStart } = taskWindow();
  const [tasks, calendar, allTags] = await Promise.all([
    fetchTasks(historyStart, weekEnd),
    fetchCalendar([today, tomorrow]),
    fetchAllTags(),
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
        initialCalendar={calendar}
        today={today}
        tomorrow={tomorrow}
        week={week}
        historyDates={historyDates}
        allTags={allTags}
        calendarConfigured={hasCalendar}
      />
    </div>
  );
}
