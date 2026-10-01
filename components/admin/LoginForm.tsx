"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startAuthentication } from "@simplewebauthn/browser";

// Passkey-only admin sign-in (Face ID / Touch ID). No password fallback —
// a lost device is handled by /admin/recover.
export default function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function signInWithPasskey() {
    setError(null);
    setBusy(true);
    try {
      const optsRes = await fetch("/api/auth/passkey/login");
      const opts = await optsRes.json();
      const response = await startAuthentication({ optionsJSON: opts });
      const verifyRes = await fetch("/api/auth/passkey/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response }),
      });
      if (!verifyRes.ok) throw new Error("passkey verification failed");
      router.push("/admin");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "passkey failed";
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <button
        type="button"
        onClick={signInWithPasskey}
        disabled={busy}
        autoFocus
        className="border border-rule rounded-sm py-2 text-sm hover:bg-foreground hover:text-background transition-colors disabled:opacity-50"
      >
        {busy ? "…" : "Sign in with passkey (Face ID / Touch ID)"}
      </button>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <Link
        href="/admin/recover"
        className="self-center text-xs text-muted/70 hover:text-foreground transition-colors"
      >
        Lost your device? Use a recovery code
      </Link>
    </div>
  );
}
