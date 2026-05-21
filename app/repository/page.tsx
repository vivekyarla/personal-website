import Link from "next/link";
import Clock from "@/components/Clock";

export const metadata = {
  title: "Repository — Vivek Yarlagedda",
};

export default function RepositoryIndex() {
  return (
    <div className="flex flex-col gap-8 text-[0.9rem]">
      {/* Back link */}
      <div>
        <Link
          href="/"
          className="text-xs text-muted/70 hover:text-foreground transition-colors"
        >
          ← home
        </Link>
      </div>

      {/* Header */}
      <header className="flex items-baseline justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Repository</h1>
        <Clock />
      </header>

      {/* Description */}
      <section className="space-y-3">
        <p className="leading-relaxed">
          &ldquo;If you&apos;re the smartest person in the room, you&apos;re in
          the wrong room.&rdquo;
        </p>
        <p className="leading-relaxed">
          &ldquo;If a smart person asks you a hard question, pay attention. The
          rest of the world will ask you the same question eventually.&rdquo;
        </p>
        <p className="leading-relaxed">
          The intersection of those two ideas are why I learn more from tweets than my classes.
        </p>
      </section>
    </div>
  );
}
