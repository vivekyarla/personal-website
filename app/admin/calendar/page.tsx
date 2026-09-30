import { redirect } from "next/navigation";
import { requireAuthOrAgentSession } from "@/lib/session";
import { addDays, ptToday } from "@/lib/tasks";
import { fetchCalendar, calendarConfigured } from "@/lib/calendar";
import CalendarStrip from "@/components/admin/CalendarStrip";

export const metadata = { title: "Admin · Calendar" };
export const dynamic = "force-dynamic";

export default async function AdminCalendar({
  searchParams,
}: {
  searchParams: Promise<{ focus?: string | string[] }>;
}) {
  if (!(await requireAuthOrAgentSession())) redirect("/admin/login");
  // ?focus=<eventKey> — set by event links on the Tasks page.
  const { focus } = await searchParams;

  // First paint covers the opening view (today ± 2 days) plus a day ahead;
  // the strip lazy-loads the rest as you scroll.
  const today = ptToday();
  const dates = Array.from({ length: 7 }, (_, i) => addDays(today, i - 2));

  const hasCalendar = calendarConfigured();
  const calendar = await fetchCalendar(hasCalendar ? dates : []);

  return (
    <div className="waterfall flex flex-col gap-6">
      <CalendarStrip
        today={today}
        initialCalendar={calendar}
        configured={hasCalendar}
        focus={typeof focus === "string" ? focus : undefined}
      />
    </div>
  );
}
