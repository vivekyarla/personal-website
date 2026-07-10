import Link from "next/link";
import Clock from "@/components/Clock";
import InboundSection from "@/components/InboundSection";
import { fetchPosts, formatDate, excerpt } from "@/lib/substack";
import { fetchInbound } from "@/lib/inbound";

export const revalidate = 60;

export const metadata = {
  title: "Writing",
};

export default async function WritingIndex() {
  const [posts, inbound] = await Promise.all([fetchPosts(), fetchInbound()]);

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
      <header className="flex items-baseline justify-between gap-3">
        <h1
          className={`text-2xl tracking-tight ${
            process.env.NODE_ENV === "development" ? "font-serif font-normal" : "font-semibold"
          }`}
        >
          Writing
        </h1>
        <Clock />
      </header>

      {/* Description */}
      <section>
        <p className="leading-relaxed italic text-center text-muted">
          &ldquo;You must strive to find your own voice, boys, and the longer
          you wait to begin, the less likely you are to find it at all.&rdquo;
          <span className="block not-italic mt-1 text-muted/70">
            — Robin Williams, Dead Poets Society
          </span>
        </p>
      </section>

      {/* Inbound | Outbound — side by side on desktop, stacked on mobile.
          Breaks out of the text column to a wider centered band. */}
      <div className="writing-bleed grid gap-8 sm:grid-cols-2 sm:gap-10 items-start">
        {/* Inbound */}
        <section className="min-w-0">
          <h2
            className={`tracking-tight mb-1.5 ${
              process.env.NODE_ENV === "development" ? "font-serif font-normal text-lg" : "text-base font-semibold"
            }`}
          >
            Inbound
          </h2>
          <p className="text-[0.8rem] text-muted/80 mb-2 italic">
            Pieces I&apos;ve read and thought were worth saving.
          </p>
          <hr className="border-rule mb-2" />
          <InboundSection items={inbound} />
        </section>

        {/* Outbound */}
        <section className="min-w-0">
          <h2
            className={`tracking-tight mb-1.5 ${
              process.env.NODE_ENV === "development" ? "font-serif font-normal text-lg" : "text-base font-semibold"
            }`}
          >
            Outbound
          </h2>
          <p className="text-[0.8rem] text-muted/80 mb-2 italic">
            My own essays, mirrored from{" "}
            <a
              className="underline decoration-rule underline-offset-4 hover:decoration-foreground"
              href="https://vyarla.substack.com"
              target="_blank"
              rel="noreferrer"
            >
              Substack
            </a>
            .
          </p>
          <hr className="border-rule mb-2" />
          {posts.length === 0 ? (
            <p className="py-3 text-muted text-[0.85rem] italic">
              Coming very soon...
            </p>
          ) : (
            <ul className="blur-group">
              {posts.map((p) => (
                <li
                  key={p.slug}
                  className="blur-item py-3 relative hover:z-10 border-t border-b border-rule -mt-px first:mt-0 first:border-t-0 last:border-b-0"
                >
                  <Link href={`/writing/${p.slug}`} className="block">
                    <div className="leading-tight">
                      <span className="font-medium">{p.title}</span>
                    </div>
                    <div className="mt-1 text-[0.72rem] text-muted/80 tabular-nums">
                      {formatDate(p.pubDateISO)}
                    </div>
                    <p className="mt-1.5 text-[0.85rem] leading-relaxed text-muted">
                      {excerpt(p.description || p.contentHtml, 200)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
