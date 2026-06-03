import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/session";
import InboundForm from "@/components/admin/InboundForm";

export const metadata = { title: "Admin · New inbound" };

export default async function NewInbound() {
  if (!(await requireAuth())) redirect("/admin/login");
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/inbound"
          className="text-xs text-muted/70 hover:text-foreground transition-colors"
        >
          ← inbound
        </Link>
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">New reading</h1>
      <InboundForm />
    </div>
  );
}
