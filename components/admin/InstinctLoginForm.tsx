"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function InstinctLoginForm() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) throw new Error("wrong token");
      router.push("/admin/tasks");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      {/* Fixed username so password vaults can match the saved credential. */}
      <input
        type="text"
        name="username"
        autoComplete="username"
        value="instinct"
        readOnly
        hidden
      />
      <label htmlFor="instinct-token" className="sr-only">
        Access token
      </label>
      <input
        id="instinct-token"
        name="password"
        type="password"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        placeholder="Access token"
        autoFocus
        autoComplete="current-password"
        className="border border-rule rounded-sm px-3 py-2 bg-transparent text-sm focus:outline-none focus:border-foreground"
      />
      <button
        type="submit"
        disabled={busy || !token}
        className="border border-rule rounded-sm py-2 text-sm hover:bg-foreground hover:text-background transition-colors disabled:opacity-50"
      >
        {busy ? "Signing in…" : "Sign in"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </form>
  );
}
