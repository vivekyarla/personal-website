import Link from "next/link";
import Clock from "@/components/Clock";
import InboundSection from "@/components/InboundSection";
import BooksSection from "@/components/BooksSection";
import { fetchInbound } from "@/lib/inbound";

export const revalidate = 60;

export const metadata = {
  title: "Reading",
  description:
    "Articles and books that materially changed my worldview — with quotes and short analysis.",
  openGraph: {
    title: "Reading — Vivek Yarlagedda",
    description:
      "Articles and books that materially changed my worldview — with quotes and short analysis.",
    url: "https://vivekyarla.com/writing",
  },
};

export default async function ReadingIndex() {
  const inbound = await fetchInbound();
  const articles = inbound.filter((i) => i.kind !== "book");
  const books = inbound.filter((i) => i.kind === "book");

  return (
    <div className="relative waterfall flex flex-col gap-8 text-[0.9rem] pt-[clamp(1.5rem,7vh,6rem)] pb-20">
      {/* Back link — out of flow so the header sits at the shared offset */}
      <div className="absolute top-6 left-0">
        <Link
          href="/"
          className="text-xs text-muted/70 hover:text-foreground transition-colors"
        >
          ← home
        </Link>
      </div>

      {/* Header */}
      <header className="flex items-center justify-between gap-3">
        <h1
          className={`text-2xl tracking-tight ${
            process.env.NODE_ENV === "development" ? "font-serif font-normal" : "font-semibold"
          }`}
        >
          Reading
        </h1>
        <Clock />
      </header>

      {/* Collection index — mirrors the repository page */}
      <section>
        <p className="text-center text-[0.72rem] text-muted/80 tabular-nums">
          {articles.length} article{articles.length === 1 ? "" : "s"} ·{" "}
          {books.length} book{books.length === 1 ? "" : "s"}
        </p>
      </section>

      {/* Articles | Books — side by side on desktop, stacked on mobile.
          Breaks out of the text column to a wider centered band. */}
      <div className="writing-bleed grid gap-8 sm:grid-cols-2 sm:gap-10 items-start">
        <section className="min-w-0">
          <h2
            className={`tracking-tight mb-1.5 ${
              process.env.NODE_ENV === "development" ? "font-serif font-normal text-lg" : "text-base font-semibold"
            }`}
          >
            Articles
          </h2>
          <hr className="border-rule mb-2" />
          <InboundSection items={articles} />
        </section>

        <section className="min-w-0">
          <h2
            className={`tracking-tight mb-1.5 ${
              process.env.NODE_ENV === "development" ? "font-serif font-normal text-lg" : "text-base font-semibold"
            }`}
          >
            Books
          </h2>
          <hr className="border-rule mb-2" />
          <BooksSection items={books} />
        </section>
      </div>
    </div>
  );
}
