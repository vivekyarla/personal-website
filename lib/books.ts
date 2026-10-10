import { supabasePublic } from "@/lib/supabase";

// Books (Reading page, right column). Public table `books`, written only via
// /api/books (admin or Instinct).
export type BookStatus = "future" | "reading" | "finished";

export type Book = {
  id: string;
  title: string;
  author: string | null;
  status: BookStatus;
  // First of the month, YYYY-MM-01: month finished (finished), started
  // (reading) or planned (future, optional).
  read_month: string | null;
  pages: number | null;
  review: string | null;
  cover_url: string | null;
  position: number; // order within "Up next"
  created_at: string;
};

export const BOOK_STATUSES: { value: BookStatus; label: string }[] = [
  { value: "future", label: "Up next" },
  { value: "reading", label: "Reading" },
  { value: "finished", label: "Finished" },
];

export async function fetchBooks(): Promise<Book[]> {
  const { data, error } = await supabasePublic.from("books").select("*");
  if (error) {
    console.error("[books] fetch error:", error.message);
    return [];
  }
  return (data ?? []) as Book[];
}

const byMonthDesc = (a: Book, b: Book) =>
  (b.read_month ?? "").localeCompare(a.read_month ?? "") ||
  b.created_at.localeCompare(a.created_at);

// Up next (in queue order), Reading, then Finished — newest month first.
export function groupBooks(books: Book[]) {
  return {
    future: books
      .filter((b) => b.status === "future")
      .sort((a, b) => a.position - b.position || a.created_at.localeCompare(b.created_at)),
    reading: books.filter((b) => b.status === "reading").sort(byMonthDesc),
    finished: books.filter((b) => b.status === "finished").sort(byMonthDesc),
  };
}

// "2026-10-01" → "Oct 2026"
export function formatBookMonth(month: string | null): string {
  if (!month) return "";
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 15)).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

// Current month in Pacific Time as YYYY-MM (for <input type="month">).
export function currentMonthPT(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
  }).format(new Date());
}
