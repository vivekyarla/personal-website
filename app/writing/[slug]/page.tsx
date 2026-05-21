import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchPost, fetchPosts, formatDate } from "@/lib/substack";

export const revalidate = 600;

export async function generateStaticParams() {
  const posts = await fetchPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await fetchPost(slug);
  if (!post) return { title: "Not found" };
  return {
    title: `${post.title} — Vivek Yarlagedda`,
    description: post.description,
    alternates: { canonical: post.url },
  };
}

export default async function WritingPost({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await fetchPost(slug);
  if (!post) notFound();

  return (
    <article className="pt-4">
      <div className="mb-10">
        <Link
          href="/writing"
          className="text-xs text-muted hover:text-foreground transition-colors"
        >
          ← All writing
        </Link>
      </div>

      <header className="mb-10">
        <h1 className="font-serif text-3xl sm:text-4xl tracking-tight leading-tight mb-3">
          {post.title}
        </h1>
        <div className="flex items-center gap-3 text-muted text-sm">
          <time dateTime={post.pubDateISO} className="font-mono text-xs">
            {formatDate(post.pubDateISO)}
          </time>
          <span className="text-rule">·</span>
          <a
            href={post.url}
            target="_blank"
            rel="noreferrer"
            className="underline decoration-rule underline-offset-4 hover:decoration-foreground text-xs"
          >
            Read on Substack
          </a>
        </div>
      </header>

      <div
        className="prose-editorial"
        dangerouslySetInnerHTML={{ __html: post.contentHtml }}
      />

      <hr className="border-rule mt-16 mb-6" />
      <p className="text-muted text-sm">
        Originally published on{" "}
        <a
          className="underline decoration-rule underline-offset-4 hover:decoration-foreground"
          href={post.url}
          target="_blank"
          rel="noreferrer"
        >
          Substack
        </a>
        .
      </p>
    </article>
  );
}
