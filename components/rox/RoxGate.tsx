"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RoxGate() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/rox/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) throw new Error("Wrong password.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed.");
      setBusy(false);
    }
  }

  return (
    <div className="waterfall flex flex-1 flex-col justify-center max-w-sm mx-auto w-full gap-6 pb-24">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Private page
        </h1>
        <p className="mt-2 text-[0.8rem] leading-relaxed text-muted">
          This one isn&apos;t linked from anywhere. If you were sent the link,
          you were sent the password with it.
        </p>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-3">
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
          {busy ? "…" : "Enter"}
        </button>
      </form>

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
