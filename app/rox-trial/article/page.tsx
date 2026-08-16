import Link from "next/link";
import { marked } from "marked";
import { requireRoxAuth } from "@/lib/session";
import RoxGate from "@/components/rox/RoxGate";
import { SHRIRAM } from "../content";
import { ARTICLE_MD, ARTICLE_TITLE } from "./content";

export const metadata = {
  title: "Why revenue agents need a knowledge graph",
  robots: { index: false, follow: false },
};

/* An X Article, rendered the way X renders one: cover, oversized title,
   author row, then the body in a single reading column. */
export default async function RoxArticle() {
  if (!(await requireRoxAuth())) return <RoxGate />;

  const html = await marked.parse(ARTICLE_MD, { gfm: true, breaks: false });

  return (
    <div className="waterfall flex flex-col pb-24">
      {/* X's article view has a sticky top bar with a back affordance */}
      <div className="x-article-bar">
        <Link href="/rox-trial" className="x-article-back">
          <svg viewBox="0 0 24 24" aria-hidden>
            <path d="M7.414 13l5.043 5.04-1.414 1.42L3.586 12l7.457-7.46 1.414 1.42L7.414 11H21v2H7.414z" />
          </svg>
          <span>Post</span>
        </Link>
      </div>

      <article className="rox-x x-article">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="x-article-cover"
          src="/rox/article/fig1_architecture.png"
          alt="Experiment architecture: both arms execute against the same Snowflake warehouse"
        />

        <h1 className="x-article-title">{ARTICLE_TITLE}</h1>

        <div className="x-article-byline">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={SHRIRAM.avatar} alt="" width={40} height={40} />
          <div>
            <div className="x-article-author">{SHRIRAM.name}</div>
            <div className="x-article-meta">
              @{SHRIRAM.handle} · Aug 18, 2026 · 6 min read
            </div>
          </div>
        </div>

        <div
          className="x-article-body"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </article>
    </div>
  );
}
