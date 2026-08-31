import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const metadata = { title: "Admin · Analytics" };
export const dynamic = "force-dynamic";

type Visit = {
  id: string;
  ts: string;
  path: string;
  referrer: string | null;
  country: string | null;
  city: string | null;
  device: string | null;
  browser: string | null;
  is_me: boolean;
};

// Day key (YYYY-MM-DD) in America/Los_Angeles for a timestamp.
function ptDay(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

function ptShort(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

function referrerHost(referrer: string | null): string {
  if (!referrer) return "direct";
  try {
    return new URL(referrer).hostname.replace(/^www\./, "") || "direct";
  } catch {
    return referrer;
  }
}

function topCounts(values: string[], n = 10): [string, number][] {
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
}

function CountList({ rows }: { rows: [string, number][] }) {
  if (rows.length === 0) {
    return <p className="text-[0.8rem] text-muted/80 italic">Nothing yet.</p>;
  }
  return (
    <ul>
      {rows.map(([label, count]) => (
        <li
          key={label}
          className="flex items-baseline justify-between gap-3 py-0.5"
        >
          <span className="text-[0.8rem] truncate">{label}</span>
          <span className="text-[0.72rem] text-muted/80 tabular-nums">
            {count}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default async function AdminAnalytics() {
  if (!(await requireAuth())) redirect("/admin/login");

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabaseAdmin
    .from("visits")
    .select("*")
    .gte("ts", since)
    .order("ts", { ascending: false })
    .limit(5000);

  const visits = (data ?? []) as Visit[];
  const others = visits.filter((v) => !v.is_me);

  const today = ptDay(new Date().toISOString());
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const visitsToday = others.filter((v) => ptDay(v.ts) === today).length;
  const visits7d = others.filter(
    (v) => new Date(v.ts).getTime() >= weekAgo
  ).length;

  const topPages = topCounts(others.map((v) => v.path));
  const topReferrers = topCounts(others.map((v) => referrerHost(v.referrer)));
  const topCountries = topCounts(
    others.map((v) => v.country).filter((c): c is string => !!c)
  );
  const recent = visits.slice(0, 50);

  return (
    <div className="waterfall flex flex-col gap-8">
      <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>

      {error && (
        <p className="text-[0.8rem] text-muted/80 italic">
          Failed to load visits: {error.message}
        </p>
      )}

      <section>
        <h2 className="text-base font-semibold tracking-tight mb-1.5">
          Visits
        </h2>
        <hr className="border-rule mb-1" />
        <ul>
          <li className="flex items-baseline justify-between gap-3 py-0.5">
            <span className="text-[0.8rem]">Today</span>
            <span className="text-[0.72rem] text-muted/80 tabular-nums">
              {visitsToday}
            </span>
          </li>
          <li className="flex items-baseline justify-between gap-3 py-0.5">
            <span className="text-[0.8rem]">Last 7 days</span>
            <span className="text-[0.72rem] text-muted/80 tabular-nums">
              {visits7d}
            </span>
          </li>
          <li className="flex items-baseline justify-between gap-3 py-0.5">
            <span className="text-[0.8rem]">Last 30 days</span>
            <span className="text-[0.72rem] text-muted/80 tabular-nums">
              {others.length}
            </span>
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-base font-semibold tracking-tight mb-1.5">
          Top pages
        </h2>
        <hr className="border-rule mb-1" />
        <CountList rows={topPages} />
      </section>

      <section>
        <h2 className="text-base font-semibold tracking-tight mb-1.5">
          Top referrers
        </h2>
        <hr className="border-rule mb-1" />
        <CountList rows={topReferrers} />
      </section>

      <section>
        <h2 className="text-base font-semibold tracking-tight mb-1.5">
          Top countries
        </h2>
        <hr className="border-rule mb-1" />
        <CountList rows={topCountries} />
      </section>

      <section>
        <h2 className="text-base font-semibold tracking-tight mb-1.5">
          Recent
        </h2>
        <hr className="border-rule mb-1" />
        {recent.length === 0 ? (
          <p className="text-[0.8rem] text-muted/80 italic">Nothing yet.</p>
        ) : (
          <ul>
            {recent.map((v) => (
              <li
                key={v.id}
                className="flex items-baseline justify-between gap-3 py-0.5"
              >
                <span className="text-[0.8rem] truncate">
                  {v.path}
                  {v.is_me && (
                    <span className="ml-1.5 text-[0.72rem] text-muted/80">
                      me
                    </span>
                  )}
                </span>
                <span className="text-[0.72rem] text-muted/80 tabular-nums text-right shrink-0">
                  {ptShort(v.ts)} · {referrerHost(v.referrer)} ·{" "}
                  {[v.city, v.country].filter(Boolean).join(", ") || "unknown"}{" "}
                  · {v.device ?? "?"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
