"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteInboundButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function del() {
    if (!confirm("Delete this reading?")) return;
    setBusy(true);
    await fetch(`/api/inbound/${id}`, { method: "DELETE" });
    router.refresh();
  }
  return (
    <button
      type="button"
      onClick={del}
      disabled={busy}
      className="text-xs text-muted hover:text-red-600 transition-colors"
    >
      Delete
    </button>
  );
}
