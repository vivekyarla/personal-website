import { NextResponse } from "next/server";
import { requireAuthOrAgent } from "@/lib/session";
import { fetchCalendar } from "@/lib/calendar";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// GET ?dates=YYYY-MM-DD,YYYY-MM-DD — polled by the tasks board so Google
// Calendar changes show up within seconds.
export async function GET(request: Request) {
  if (!(await requireAuthOrAgent(request))) {
    return NextResponse.json({ error: "unauth" }, { status: 401 });
  }
  const dates = (new URL(request.url).searchParams.get("dates") ?? "")
    .split(",")
    .filter((d) => DATE_RE.test(d))
    .slice(0, 7);
  if (dates.length === 0) {
    return NextResponse.json({ error: "missing dates" }, { status: 400 });
  }
  const data = await fetchCalendar(dates);
  return NextResponse.json(data, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
