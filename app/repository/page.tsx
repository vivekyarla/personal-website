import Link from "next/link";
import Clock from "@/components/Clock";

export const metadata = {
  title: "Repository — Vivek Yarlagedda",
};

export default function RepositoryIndex() {
  return (
    <div className="waterfall flex flex-col text-[0.9rem]">
      {/* Back link */}
      <div className="mb-8">
        <Link
          href="/"
          className="text-xs text-muted/70 hover:text-foreground transition-colors"
        >
          ← home
        </Link>
      </div>

      {/* Header */}
      <header className="mb-8 flex items-baseline justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Repository</h1>
        <Clock />
      </header>

      {/* Description — each paragraph animates independently */}
      <p className="mb-3 leading-relaxed italic text-center">
        &ldquo;If you&apos;re the smartest person in the room, you&apos;re in
        the wrong room.&rdquo;
      </p>
      <p className="mb-3 leading-relaxed italic text-center">
        &ldquo;If a smart person asks you a hard question, pay attention. The
        rest of the world will ask you the same question eventually.&rdquo;
      </p>
      <p className="leading-relaxed text-center">
        The intersection of those two ideas are why I learn more from tweets
        than my classes.
      </p>
    </div>
  );
}
