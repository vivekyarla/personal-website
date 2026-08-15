import Link from "next/link";
import Clock from "@/components/Clock";
import RoxGate from "@/components/rox/RoxGate";
import { DraftThread, DraftTweet } from "@/components/rox/DraftTweet";
import { requireRoxAuth } from "@/lib/session";
import { ADDITIONAL, THREAD } from "./content";

export const metadata = {
  title: "Rox · X strategy",
  robots: { index: false, follow: false },
};

const heading =
  process.env.NODE_ENV === "development"
    ? "font-serif font-normal"
    : "font-semibold";

function H2({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <h2 className={`text-base tracking-tight ${heading}`}>
      <span className="mr-2 text-[0.72rem] text-muted/70 tabular-nums align-middle">
        {n}
      </span>
      {children}
    </h2>
  );
}

export default async function RoxTrial() {
  if (!(await requireRoxAuth())) return <RoxGate />;

  return (
    <div className="relative waterfall flex flex-col text-[0.9rem] pt-[clamp(1.5rem,7vh,6rem)] pb-24">
      <div className="absolute top-6 left-0">
        <Link
          href="/"
          className="text-xs text-muted/70 hover:text-foreground transition-colors"
        >
          ← vivekyarla.com
        </Link>
      </div>

      <header className="mb-8 flex items-baseline justify-between gap-3">
        <h1 className={`text-2xl tracking-tight ${heading}`}>Rox · X strategy</h1>
        <Clock />
      </header>

      <p className="leading-relaxed">
        <strong className="font-semibold">Goal:</strong> get Rox&apos;s paper on
        knowledge graphs in CRM workflows to 100K organic views.
      </p>

      <hr className="rox-rule" />

      <H2 n="01">The main thread</H2>
      <div className="mt-5">
        <DraftThread tweets={THREAD} />
      </div>

      <hr className="rox-rule" />

      <H2 n="02">Additional posts</H2>
      <div className="mt-5 flex flex-col gap-4">
        {ADDITIONAL.map((draft, i) => (
          <DraftTweet draft={draft} key={i} />
        ))}
      </div>

      <hr className="rox-rule" />

      <H2 n="03">Inspiration &amp; approach</H2>
    </div>
  );
}
