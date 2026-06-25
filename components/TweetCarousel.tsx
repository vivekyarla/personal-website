import { tweetIdFromUrl, type TweetWithCategory } from "@/lib/tweets";
import RepoTweet from "@/components/RepoTweet";

export default function TweetCarousel({
  tweets,
}: {
  tweets: TweetWithCategory[];
}) {
  return (
    <div className="overflow-x-auto snap-x snap-mandatory scrollbar-hidden touch-pan-x">
      <div className="tweet-spot-group flex items-start pb-2">
        {tweets.map((t) => {
          const id = tweetIdFromUrl(t.url);
          return (
            <div
              key={t.id}
              className="tweet-spot-item snap-start shrink-0 w-[74vw] sm:w-[356px] max-w-[356px] pr-4"
            >
              {id ? (
                <RepoTweet id={id} url={t.url} note={t.note} />
              ) : (
                <a
                  href={t.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block p-4 text-sm text-muted hover:text-foreground transition-colors"
                >
                  View on X →
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
