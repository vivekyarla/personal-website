import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireAuthOrAgentSession } from "@/lib/session";

const TABS = ["/admin/tasks", "/admin/calendar", "/admin/habits", "/admin/inbound"];

// vivekyarla.com/admin/hub — the hub's own URL. Opens the tab used last
// (remembered by AdminSwitcher in the `hub_tab` cookie), else Tasks.
export default async function Hub() {
  if (!(await requireAuthOrAgentSession())) redirect("/admin/login");
  const last = (await cookies()).get("hub_tab")?.value;
  redirect(last && TABS.includes(last) ? last : "/admin/tasks");
}
