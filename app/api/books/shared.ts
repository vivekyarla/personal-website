import type { BookStatus } from "@/lib/books";

// Validates/normalizes a book payload. `partial` (PATCH) only touches fields
// that are present. Returns the clean row or an error message.
const STATUSES: BookStatus[] = ["future", "reading", "finished"];

export function cleanBook(body: Record<string, unknown>, partial: boolean) {
  const out: Record<string, unknown> = {};
  const has = (k: string) => k in body;

  if (!partial || has("title")) {
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) return { error: "title required" };
    out.title = title;
  }
  if (has("author")) out.author = typeof body.author === "string" && body.author.trim() ? body.author.trim() : null;
  if (!partial || has("status")) {
    const status = (body.status ?? "finished") as BookStatus;
    if (!STATUSES.includes(status)) return { error: "bad status" };
    out.status = status;
  }
  if (has("read_month")) {
    // accepts "YYYY-MM" or "YYYY-MM-DD"; stored as the 1st of the month
    const m = typeof body.read_month === "string" ? body.read_month.match(/^(\d{4})-(\d{2})/) : null;
    if (body.read_month && !m) return { error: "bad read_month" };
    out.read_month = m ? `${m[1]}-${m[2]}-01` : null;
  }
  if (has("pages")) {
    const n = body.pages === null || body.pages === "" ? null : Number(body.pages);
    if (n !== null && (!Number.isInteger(n) || n <= 0 || n > 20000)) return { error: "bad pages" };
    out.pages = n;
  }
  if (has("review")) out.review = typeof body.review === "string" && body.review.trim() ? body.review.trim() : null;
  if (has("cover_url")) {
    const u = typeof body.cover_url === "string" ? body.cover_url.trim() : "";
    if (u && !/^https:\/\//.test(u)) return { error: "cover_url must be https" };
    out.cover_url = u || null;
  }
  if (has("position")) {
    const n = Number(body.position);
    if (!Number.isInteger(n)) return { error: "bad position" };
    out.position = n;
  }
  return { row: out };
}
