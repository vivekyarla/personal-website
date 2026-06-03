import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { requireAuth } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";
import InboundForm from "@/components/admin/InboundForm";
import type { InboundReading } from "@/lib/inbound";

export const metadata = { title: "Admin · Edit inbound" };
export const dynamic = "force-dynamic";

export default async function EditInbound({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await requireAuth())) redirect("/admin/login");
  const { id } = await params;
  const { data, error } = await supabaseAdmin
    .from("inbound_readings")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data) notFound();
  const reading = data as InboundReading;

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
      <h1 className="text-2xl font-semibold tracking-tight">Edit reading</h1>
      <InboundForm initial={reading} />
    </div>
  );
}
