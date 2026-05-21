import Link from "next/link";
import Clock from "@/components/Clock";
import { fetchPosts, formatDate, excerpt } from "@/lib/substack";
import { inboundItems, formatInboundDate } from "@/lib/inbound";

export const revalidate = 600;

export const metadata = {
  title: "Writing — Vivek Yarlagedda",
};

export default async function WritingIndex() {
  const posts = await fetchPosts();

  return (
    <div className="waterfall flex flex-col gap-8 text-[0.9rem]">
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
      <header className="flex items-baseline justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Writing</h1>
        <Clock />
      </header>

      {/* Description */}
      <section>
        <p className="leading-relaxed">
          I believe that growth happens quickest by ingesting high-quality
          content, making my own predictive theses, and testing them against
          empirical feedback.
        </p>
      </section>

      {/* Inbound */}
      <section>
        <h2 className="text-base font-semibold tracking-tight mb-1.5">
          Inbound
        </h2>
        <p className="text-[0.8rem] text-muted/80 mb-2 italic">
          Pieces I&apos;ve read and thought were worth saving.
        </p>
        <hr className="border-rule mb-1" />
        {inboundItems.length === 0 ? (
          <p className="py-3 text-muted text-[0.85rem] italic">
            Nothing here yet.
          </p>
        ) : (
          <ul className="divide-y divide-rule">
            {inboundItems.map((item) => (
              <li key={item.url} className="py-3">
                <div className="flex items-baseline justify-between gap-4 leading-tight">
                  <div className="min-w-0">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium underline decoration-rule underline-offset-4 hover:decoration-foreground"
                    >
                      {item.title}
                    </a>
                    <div className="italic text-muted text-[0.85rem]">
                      {item.source}
                    </div>
                  </div>
                  <span className="text-muted text-[0.8rem] whitespace-nowrap tabular-nums">
                    {formatInboundDate(item.date)}
                  </span>
                </div>
                <p className="mt-1.5 text-[0.85rem] leading-relaxed text-muted">
                  {item.note}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Outbound */}
      <section>
        <h2 className="text-base font-semibold tracking-tight mb-1.5">
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
        <hr className="border-rule mb-1" />
        {posts.length === 0 ? (
          <p className="py-3 text-muted text-[0.85rem] italic">
            Nothing here yet.
          </p>
        ) : (
          <ul className="divide-y divide-rule">
            {posts.map((p) => (
              <li key={p.slug} className="py-3">
                <Link href={`/writing/${p.slug}`} className="group block">
                  <div className="flex items-baseline justify-between gap-4 leading-tight">
                    <span className="font-medium group-hover:opacity-70 transition-opacity">
                      {p.title}
                    </span>
                    <span className="text-muted text-[0.8rem] whitespace-nowrap tabular-nums">
                      {formatDate(p.pubDateISO)}
                    </span>
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
  );
}
