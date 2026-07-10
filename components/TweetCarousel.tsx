import { tweetIdFromUrl, type TweetWithCategory } from "@/lib/tweets";
import RepoTweet from "@/components/RepoTweet";
import TweetSpotlightGroup from "@/components/TweetSpotlightGroup";

export default function TweetCarousel({
  tweets,
  showCategory = false,
}: {
  tweets: TweetWithCategory[];
  showCategory?: boolean;
}) {
  return (
    <div className="tweet-bleed">
      <TweetSpotlightGroup>
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
              {/* Category label — inside the spot item so it blurs/sharpens
                  together with its tweet */}
              {showCategory && t.category?.name && (
                <div className="mt-1.5 text-left text-[0.68rem] uppercase tracking-wide text-muted/80">
                  {t.category.name}
                </div>
              )}
            </div>
          );
        })}
      </TweetSpotlightGroup>
      <span aria-hidden className="tweet-edge tweet-edge-left" />
      <span aria-hidden className="tweet-edge tweet-edge-right" />
    </div>
  );
}
