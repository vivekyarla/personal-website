import Link from "next/link";
import Clock from "@/components/Clock";
import NameToggle from "@/components/NameToggle";

export default function NotFound() {
  return (
    <div className="waterfall flex flex-1 flex-col gap-8 text-[0.9rem] pt-[clamp(1.5rem,7vh,6rem)] pb-12">
      {/* Name + live clock — same header as home */}
      <header className="flex items-baseline justify-between gap-3">
        <NameToggle />
        <Clock />
      </header>

      {/* Message — centered horizontally and vertically in the free space */}
      <section className="flex-1 flex flex-col items-center justify-center text-center">
        <p className="leading-relaxed">
          This page does not exist. What a tragedy.
        </p>
        <p className="mt-4">
          <Link
            href="/"
            className="underline decoration-rule underline-offset-4 hover:decoration-foreground"
          >
            ← home
          </Link>
        </p>
      </section>

      {/* Links */}
      <section>
        <ul className="flex flex-wrap justify-center gap-x-5 gap-y-1.5 text-[0.85rem]">
          <li>
            <a
              className="underline decoration-rule underline-offset-4 hover:decoration-foreground"
              href="https://x.com/vivekyarla"
              target="_blank"
              rel="noreferrer"
            >
              <span className="line-through decoration-foreground/60">Twitter</span> X
            </a>
          </li>
          <li>
            <a
              className="underline decoration-rule underline-offset-4 hover:decoration-foreground"
              href="https://linkedin.com/in/vivekyarla"
              target="_blank"
              rel="noreferrer"
            >
              LinkedIn
            </a>
          </li>
          <li>
            <a
              className="underline decoration-rule underline-offset-4 hover:decoration-foreground"
              href="https://vyarla.substack.com"
              target="_blank"
              rel="noreferrer"
            >
              Substack
            </a>
          </li>
          <li>
            <a
              className="underline decoration-rule underline-offset-4 hover:decoration-foreground"
              href="mailto:viveky@stanford.edu"
            >
              Email
            </a>
          </li>
        </ul>
      </section>
    </div>
  );
}
