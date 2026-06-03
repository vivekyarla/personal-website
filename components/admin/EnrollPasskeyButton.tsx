"use client";

import { useState } from "react";
import { startRegistration } from "@simplewebauthn/browser";

export default function EnrollPasskeyButton() {
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function enroll() {
    setStatus(null);
    setBusy(true);
    try {
      const optsRes = await fetch("/api/auth/passkey/register");
      if (!optsRes.ok) throw new Error("could not get registration options");
      const opts = await optsRes.json();
      const response = await startRegistration({ optionsJSON: opts });
      const label = navigator.userAgent.includes("iPhone")
        ? "iPhone"
        : navigator.userAgent.includes("Mac")
        ? "Mac"
        : "device";
      const verifyRes = await fetch("/api/auth/passkey/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response, label }),
      });
      if (!verifyRes.ok) throw new Error("verification failed");
      setStatus("Passkey enrolled ✓");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={enroll}
        disabled={busy}
        className="self-start border border-rule rounded-sm py-2 px-4 text-sm hover:bg-foreground hover:text-background transition-colors disabled:opacity-50"
      >
        {busy ? "…" : "Enroll passkey on this device"}
      </button>
      {status && <p className="text-xs text-muted">{status}</p>}
    </div>
  );
}
