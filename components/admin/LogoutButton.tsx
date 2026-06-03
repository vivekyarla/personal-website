"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function logout() {
    setBusy(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }
  return (
    <button
      type="button"
      onClick={logout}
      disabled={busy}
      className="text-xs text-muted hover:text-foreground transition-colors"
    >
      Sign out
    </button>
  );
}
