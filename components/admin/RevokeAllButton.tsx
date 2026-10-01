"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Signs out every admin and Instinct session on every device (incl. this one).
export default function RevokeAllButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function revoke() {
    if (
      !window.confirm(
        "Sign out everywhere? Every device — and Instinct — will need to sign in again."
      )
    )
      return;
    setBusy(true);
    setError(null);
    const res = await fetch("/api/auth/revoke-all", { method: "POST" }).catch(
      () => null
    );
    if (!res?.ok) {
      setError("Couldn't sign out everywhere — try again.");
      setBusy(false);
      return;
    }
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={revoke}
        disabled={busy}
        className="self-start border border-rule rounded-sm py-2 px-4 text-sm hover:bg-foreground hover:text-background transition-colors disabled:opacity-50"
      >
        {busy ? "…" : "Sign out everywhere"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
