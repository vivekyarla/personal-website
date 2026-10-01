"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { startRegistration } from "@simplewebauthn/browser";

// Step 1: recovery code → short-lived enroll-only session.
// Step 2: enroll a passkey here (Face ID / Touch ID) → back to sign-in.
export default function RecoverForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"code" | "enroll">("code");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submitCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (!res.ok) throw new Error("wrong code");
      setCode("");
      setStep("enroll");
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed");
    } finally {
      setBusy(false);
    }
  }

  async function enroll() {
    setError(null);
    setBusy(true);
    try {
      const optsRes = await fetch("/api/auth/passkey/register");
      if (!optsRes.ok) throw new Error("recovery expired — start again");
      const opts = await optsRes.json();
      const response = await startRegistration({ optionsJSON: opts });
      const label = navigator.userAgent.includes("iPhone")
        ? "iPhone (recovery)"
        : navigator.userAgent.includes("Mac")
          ? "Mac (recovery)"
          : "device (recovery)";
      const res = await fetch("/api/auth/passkey/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response, label }),
      });
      if (!res.ok) throw new Error("verification failed");
      router.push("/admin/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed");
    } finally {
      setBusy(false);
    }
  }

  const button =
    "border border-rule rounded-sm py-2 text-sm hover:bg-foreground hover:text-background transition-colors disabled:opacity-50";

  return step === "code" ? (
    <form onSubmit={submitCode} className="flex flex-col gap-3">
      <input
        type="password"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Recovery code"
        autoFocus
        autoComplete="off"
        className="border border-rule rounded-sm py-2 px-3 text-sm bg-transparent focus:outline-none focus:border-foreground"
      />
      <button type="submit" disabled={busy || !code} className={button}>
        {busy ? "…" : "Continue"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </form>
  ) : (
    <div className="flex flex-col gap-3">
      <button type="button" onClick={enroll} disabled={busy} className={button}>
        {busy ? "…" : "Enroll passkey on this device"}
      </button>
      <p className="text-xs text-muted/70">
        You have 10 minutes. Afterwards, sign in with the new passkey.
      </p>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
