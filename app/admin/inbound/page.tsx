import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAuthOrAgentSession } from "@/lib/session";
import { fetchInbound, formatInboundDate } from "@/lib/inbound";
import DeleteInboundButton from "@/components/admin/DeleteInboundButton";
import DeleteBookButton from "@/components/admin/DeleteBookButton";
import { BOOK_STATUSES, fetchBooks, formatBookMonth, groupBooks } from "@/lib/books";

export const metadata = { title: "Admin · Readings" };
export const dynamic = "force-dynamic";

export default async function AdminInbound() {
  if (!(await requireAuthOrAgentSession())) redirect("/admin/login");
  const [items, books] = await Promise.all([fetchInbound(), fetchBooks()]);
  const grouped = groupBooks(books);

  return (
    <div className="waterfall flex flex-col gap-6">
      <header className="flex items-baseline justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Readings</h1>
      </header>

      {/* Books */}
      <section className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-base font-semibold tracking-tight">Books</h2>
          <Link
            href="/admin/inbound/books/new"
            className="text-sm border border-rule rounded-sm px-3 py-1.5 hover:bg-foreground hover:text-background transition-colors"
          >
            + New book
          </Link>
        </div>
        {books.length === 0 ? (
          <p className="text-muted italic text-[0.85rem]">No books yet.</p>
        ) : (
          BOOK_STATUSES.map(({ value, label }) =>
            grouped[value].length === 0 ? null : (
              <div key={value}>
                <div className="pt-2 pb-1 text-[0.68rem] uppercase tracking-wide text-muted/80">
                  {label}
                </div>
                <ul className="divide-y divide-rule">
                  {grouped[value].map((b) => (
                    <li key={b.id} className="py-2 flex items-center justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="h-12 w-8 shrink-0 overflow-hidden rounded-[2px] bg-foreground/[0.06]">
                          {b.cover_url && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={b.cover_url} alt="" className="h-full w-full object-cover" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium leading-tight truncate">{b.title}</div>
                          <div className="text-[0.8rem] text-muted leading-tight">
                            {[b.author, formatBookMonth(b.read_month), b.pages && `${b.pages} pp`]
                              .filter(Boolean)
                              .join(" · ")}
                            {!b.review && b.status === "finished" && " · no review"}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <Link
                          href={`/admin/inbound/books/${b.id}`}
                          className="text-xs underline decoration-rule underline-offset-4 hover:decoration-foreground"
                        >
                          Edit
                        </Link>
                        <DeleteBookButton id={b.id} />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )
          )
        )}
      </section>

      {/* Articles */}
      <div className="flex items-baseline justify-between gap-3 pt-2">
        <h2 className="text-base font-semibold tracking-tight">Articles</h2>
        <Link
          href="/admin/inbound/new"
          className="text-sm border border-rule rounded-sm px-3 py-1.5 hover:bg-foreground hover:text-background transition-colors"
        >
          + New article
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="text-muted italic text-[0.85rem]">No articles yet.</p>
      ) : (
        <ul className="divide-y divide-rule">
          {items.map((item) => (
            <li
              key={item.id}
              className="py-3 flex items-baseline justify-between gap-4"
            >
              <div className="min-w-0">
                <div className="font-medium leading-tight flex items-baseline gap-2">
                  {item.pinned && (
                    <span title="Pinned" className="text-[0.7rem]">📌</span>
                  )}
                  {item.title}
                </div>
                <div className="text-[0.8rem] text-muted leading-tight">
                  {item.tag ?? "—"} · {formatInboundDate(item.date_published)}{" "}
                  · {item.quotes.length} quote
                  {item.quotes.length === 1 ? "" : "s"}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Link
                  href={`/admin/inbound/${item.id}`}
                  className="text-xs underline decoration-rule underline-offset-4 hover:decoration-foreground"
                >
                  Edit
                </Link>
                <DeleteInboundButton id={item.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
