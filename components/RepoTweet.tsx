import { getTweet } from "react-tweet/api";
import { EmbeddedTweet, TweetNotFound } from "react-tweet";

// Server-rendered tweet — fetched and rendered to HTML on the server so it
// appears fully-formed on page load (no widgets.js, no blockquote→iframe flash).
export default async function RepoTweet({
  id,
  url,
  note,
}: {
  id: string;
  url: string;
  note?: string | null;
}) {
  let tweet = null;
  try {
    tweet = await getTweet(id);
  } catch {
    tweet = null;
  }

  return (
    <div>
      {tweet ? (
        <EmbeddedTweet tweet={tweet} />
      ) : (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="block p-4 text-sm text-muted hover:text-foreground transition-colors"
        >
          View on X →
        </a>
      )}
      {note && (
        <p className="mt-1 text-[0.8rem] italic text-muted">{note}</p>
      )}
    </div>
  );
}
