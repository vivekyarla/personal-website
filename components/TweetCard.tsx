import type { TweetWithCategory } from "@/lib/tweets";

export default function TweetCard({ tweet }: { tweet: TweetWithCategory }) {
  return (
    <div>
      {tweet.embed_html ? (
        <div
          className="tweet-embed [&_blockquote]:!my-0 [&_iframe]:!w-full"
          dangerouslySetInnerHTML={{ __html: tweet.embed_html }}
        />
      ) : (
        <a
          href={tweet.url}
          target="_blank"
          rel="noreferrer"
          className="block p-4 text-sm text-muted hover:text-foreground transition-colors"
        >
          {tweet.author_name ?? "View on X"} → {tweet.url}
        </a>
      )}
      {tweet.note && (
        <p className="mt-1 text-[0.8rem] italic text-muted">{tweet.note}</p>
      )}
    </div>
  );
}
