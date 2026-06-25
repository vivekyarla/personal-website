import type { TweetWithCategory } from "@/lib/tweets";
import TweetCard from "@/components/TweetCard";

export default function TweetCarousel({
  tweets,
}: {
  tweets: TweetWithCategory[];
}) {
  return (
    <div className="overflow-x-auto snap-x snap-mandatory scrollbar-hidden touch-pan-x">
      <div className="tweet-spot-group flex pb-2">
        {tweets.map((t) => (
          <div
            key={t.id}
            className="tweet-spot-item snap-start shrink-0 w-[74vw] sm:w-[356px] max-w-[356px] pr-4"
          >
            <TweetCard tweet={t} />
          </div>
        ))}
      </div>
    </div>
  );
}
