import { NextResponse } from "next/server";
import { requireAuthOrAgent } from "@/lib/session";
import { lookupCovers } from "@/lib/book-lookup";

// GET ?title=&author= → { candidates: [{ cover_url, pages, title, author,
// year }] } — powers the admin form's automatic cover + page count.
export async function GET(request: Request) {
  if (!(await requireAuthOrAgent(request))) {
    return NextResponse.json({ error: "unauth" }, { status: 401 });
  }
  const q = new URL(request.url).searchParams;
  const candidates = await lookupCovers(q.get("title") ?? "", q.get("author") ?? "");
  return NextResponse.json({ candidates });
}
