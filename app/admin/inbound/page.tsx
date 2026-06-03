import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/session";
import { fetchInbound, formatInboundDate } from "@/lib/inbound";
import DeleteInboundButton from "@/components/admin/DeleteInboundButton";

export const metadata = { title: "Admin · Inbound" };
export const dynamic = "force-dynamic";

export default async function AdminInbound() {
  if (!(await requireAuth())) redirect("/admin/login");
  const items = await fetchInbound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin"
          className="text-xs text-muted/70 hover:text-foreground transition-colors"
        >
          ← admin
        </Link>
      </div>

      <header className="flex items-baseline justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Inbound</h1>
        <Link
          href="/admin/inbound/new"
          className="text-sm border border-rule rounded-sm px-3 py-1.5 hover:bg-foreground hover:text-background transition-colors"
        >
          + New
        </Link>
      </header>

      {items.length === 0 ? (
        <p className="text-muted italic text-[0.85rem]">No readings yet.</p>
      ) : (
        <ul className="divide-y divide-rule">
          {items.map((item) => (
            <li
              key={item.id}
              className="py-3 flex items-baseline justify-between gap-4"
            >
              <div className="min-w-0">
                <div className="font-medium leading-tight">{item.title}</div>
                <div className="text-[0.8rem] text-muted leading-tight">
                  {item.tag ?? "—"} · {formatInboundDate(item.date_read)} ·{" "}
                  {item.quotes.length} quote{item.quotes.length === 1 ? "" : "s"}
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
