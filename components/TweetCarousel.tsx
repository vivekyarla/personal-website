import type { TweetWithCategory } from "@/lib/tweets";
import TweetCard from "@/components/TweetCard";

export default function TweetCarousel({
  tweets,
}: {
  tweets: TweetWithCategory[];
}) {
  return (
    <div className="-mx-6 sm:-mx-8 overflow-x-auto snap-x snap-mandatory scrollbar-hidden touch-pan-x">
      <div className="flex gap-4 px-6 sm:px-8 pb-2">
        {tweets.map((t) => (
          <div
            key={t.id}
            className="snap-start shrink-0 w-[70vw] sm:w-[340px] max-w-[340px]"
          >
            <TweetCard tweet={t} />
          </div>
        ))}
      </div>
    </div>
  );
}
