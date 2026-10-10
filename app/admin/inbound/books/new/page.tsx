import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAuthOrAgentSession } from "@/lib/session";
import { currentMonthPT } from "@/lib/books";
import BookForm from "@/components/admin/BookForm";

export const metadata = { title: "Admin · New book" };
export const dynamic = "force-dynamic";

export default async function NewBook() {
  if (!(await requireAuthOrAgentSession())) redirect("/admin/login");
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/inbound" className="text-xs text-muted/70 hover:text-foreground transition-colors">
          ← readings
        </Link>
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">New book</h1>
      <BookForm currentMonth={currentMonthPT()} />
    </div>
  );
}
