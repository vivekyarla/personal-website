import Link from "next/link";

export default function Nav() {
  return (
    <nav className="py-10">
      <Link
        href="/"
        className="text-xs tracking-wide text-muted/60 hover:text-foreground transition-colors"
      >
        vivekyarla.com
      </Link>
    </nav>
  );
}
