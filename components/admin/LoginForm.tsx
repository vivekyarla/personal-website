"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { startAuthentication } from "@simplewebauthn/browser";

export default function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) throw new Error("wrong password");
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed");
    } finally {
      setBusy(false);
    }
  }

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
        className="border border-rule rounded-sm py-2 text-sm hover:bg-foreground hover:text-background transition-colors disabled:opacity-50"
      >
        Sign in with passkey (TouchID / FaceID)
      </button>

      <div className="flex items-center gap-3 text-xs text-muted">
        <span className="flex-1 h-px bg-rule" />
        <span>or</span>
        <span className="flex-1 h-px bg-rule" />
      </div>

      <form onSubmit={submitPassword} className="flex flex-col gap-3">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoFocus
          autoComplete="current-password"
          className="border border-rule rounded-sm py-2 px-3 text-sm bg-transparent focus:outline-none focus:border-foreground"
        />
        <button
          type="submit"
          disabled={busy || password.length === 0}
          className="border border-rule rounded-sm py-2 text-sm hover:bg-foreground hover:text-background transition-colors disabled:opacity-50"
        >
          {busy ? "…" : "Sign in"}
        </button>
      </form>

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
