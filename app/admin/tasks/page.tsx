import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/session";
import { fetchTasks, taskWindow } from "@/lib/tasks";
import { fetchCalendarEvents, calendarConfigured } from "@/lib/calendar";
import TasksBoard from "@/components/admin/TasksBoard";

export const metadata = { title: "Admin · Tasks" };
export const dynamic = "force-dynamic";

export default async function AdminTasks() {
  if (!(await requireAuth())) redirect("/admin/login");

  const { today, tomorrow, week, weekEnd } = taskWindow();
  const [tasks, events] = await Promise.all([
    fetchTasks(weekEnd, today),
    fetchCalendarEvents([today, tomorrow]),
  ]);

  const hasCalendar = calendarConfigured();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link
          href="/admin"
          className="text-xs text-muted/70 hover:text-foreground transition-colors"
        >
          ← admin
        </Link>
      </div>

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
        calendarConfigured={hasCalendar}
      />
    </div>
  );
}
