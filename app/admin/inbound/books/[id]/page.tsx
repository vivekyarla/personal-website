import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireAuthOrAgentSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { currentMonthPT, type Book } from "@/lib/books";
import BookForm from "@/components/admin/BookForm";

export const metadata = { title: "Admin · Edit book" };
export const dynamic = "force-dynamic";

export default async function EditBook({ params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAuthOrAgentSession())) redirect("/admin/login");
  const { id } = await params;
  const { data } = await supabaseAdmin.from("books").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/inbound" className="text-xs text-muted/70 hover:text-foreground transition-colors">
          ← readings
        </Link>
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">Edit book</h1>
      <BookForm initial={data as Book} currentMonth={currentMonthPT()} />
    </div>
  );
}
