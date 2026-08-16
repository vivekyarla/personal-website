import Link from "next/link";
import {
  enrichTweet,
  QuotedTweetBody,
  QuotedTweetContainer,
  QuotedTweetHeader,
  TweetActions,
  TweetBody,
  TweetContainer,
  TweetHeader,
  TweetInfo,
  TweetMedia,
  TweetReplies,
} from "react-tweet";
import type { Tweet } from "react-tweet/api";

/* Drafts are rendered through react-tweet's own EmbeddedTweet — the same
   component /repository uses for real embeds — by synthesising the object
   shape the syndication API would have returned. That way the cards are
   identical to the real ones by construction, not by imitation, and they
   inherit the .react-tweet-theme vars already set in globals.css. */

export type XAuthor = {
  name: string;
  handle: string;
  avatar: string;
};

export type XMedia = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

/** The summary_large_image link preview X builds from a URL in the post. */
export type XCard = {
  url: string;
  domain: string;
  title: string;
  image: string;
};

/** An X Article attached to a post — the card X shows for long-form. */
export type XArticle = {
  href: string;
  title: string;
  cover: string;
  meta: string;
};

export type XDraft = {
  author: XAuthor;
  text: string;
  media?: XMedia;
  /** A post gets either media or a link card — X never renders both. */
  card?: XCard;
  article?: XArticle;
  /** Stands in for footage that doesn't exist yet. */
  video?: { spec: string };
  /** The post being quote-tweeted, rendered as X's inset card. */
  quoted?: XDraft;
  /** ISO timestamp shown under the post, as X shows it. */
  postedAt: string;
  /** Small caption under the card, matching /repository's category labels. */
  label?: string;
};

/* ── entities ─────────────────────────────────────────────────────────
   X auto-links @mentions and bare domains. react-tweet colours whatever
   we hand it in `entities`, so we derive them from the text. Indices are
   code-point offsets, which is what enrichTweet slices on. */

const MENTION = /@[A-Za-z0-9_]{1,15}/g;
const URLISH =
  /(?:https?:\/\/)?(?:[a-z0-9-]+\.)+(?:com|io|org|ai|dev|net)(?:\/[^\s]*)?/gi;

function buildEntities(text: string) {
  const user_mentions = Array.from(text.matchAll(MENTION)).map((m) => ({
    id_str: "0",
    name: m[0].slice(1),
    screen_name: m[0].slice(1),
    indices: [m.index!, m.index! + m[0].length] as [number, number],
  }));

  const taken = new Set(
    user_mentions.flatMap((m) => {
      const out: number[] = [];
      for (let i = m.indices[0]; i < m.indices[1]; i++) out.push(i);
      return out;
    })
  );

  const urls = Array.from(text.matchAll(URLISH))
    .filter((m) => !taken.has(m.index!))
    .map((m) => {
      // X truncates long URLs in the rendered text and keeps the full one
      // behind the link.
      const bare = m[0].replace(/^https?:\/\//, "");
      return {
        display_url: bare.length > 30 ? `${bare.slice(0, 30)}…` : bare,
        expanded_url: m[0].startsWith("http") ? m[0] : `https://${m[0]}`,
        url: m[0],
        indices: [m.index!, m.index! + m[0].length] as [number, number],
      };
    });

  return { hashtags: [], symbols: [], user_mentions, urls };
}

/* ── the synthetic tweet ─────────────────────────────────────────────── */

function buildTweet(draft: XDraft): Tweet {
  const { author, text, media, postedAt } = draft;

  const tweet = {
    __typename: "Tweet",
    lang: "en",
    // Drafts, so there is nothing to count yet.
    favorite_count: 0,
    conversation_count: 0,
    news_action_type: "conversation",
    created_at: postedAt,
    display_text_range: [0, Array.from(text).length],
    entities: buildEntities(text),
    id_str: "0",
    text,
    isEdited: false,
    isStaleEdit: false,
    edit_control: {
      edit_tweet_ids: ["0"],
      editable_until_msecs: "0",
      is_edit_eligible: false,
      edits_remaining: "0",
    },
    user: {
      id_str: "0",
      name: author.name,
      profile_image_url_https: author.avatar,
      profile_image_shape: "Circle",
      screen_name: author.handle,
      verified: false,
      is_blue_verified: true,
    },
    ...(media
      ? {
          mediaDetails: [
            {
              display_url: "",
              expanded_url: "",
              ext_media_availability: { status: "Available" },
              indices: [0, 0],
              media_url_https: `https://vivekyarla.com${media.src}`,
              original_info: {
                width: media.width,
                height: media.height,
                focus_rects: [],
              },
              sizes: {},
              type: "photo",
              url: "",
              ext_alt_text: media.alt,
            },
          ],
        }
      : {}),
  };

  // The synthetic object satisfies every field the renderer touches; the
  // remaining ones on the API type are metadata no component reads.
  return tweet as unknown as Tweet;
}

/* react-tweet rewrites media URLs into the twimg `?format=&name=` form.
   Ours are local files, so we undo that and serve the plain path. */
function MediaImg(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  let src = typeof props.src === "string" ? props.src : "";
  try {
    const url = new URL(src);
    const format = url.searchParams.get("format");
    src = format ? `${url.pathname}.${format}` : url.pathname;
  } catch {
    /* already relative */
  }
  // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
  return <img {...props} src={src} loading="lazy" />;
}

/* X's summary_large_image card. react-tweet has no renderer for these, so
   it's ours — but it sits inside TweetContainer and styles itself off the
   same --tweet-* vars, so it matches the card it lives in. */
function LinkCard({ card }: { card: XCard }) {
  return (
    <a
      className="rox-linkcard"
      href={card.url}
      target="_blank"
      rel="noreferrer"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={card.image} alt="" loading="lazy" />
      <span className="rox-linkcard-body">
        <span className="rox-linkcard-domain">{card.domain}</span>
        <span className="rox-linkcard-title">{card.title}</span>
      </span>
    </a>
  );
}

/* Placeholder for unshot footage, sized to X's video player. */
function VideoSlot({ spec }: { spec: string }) {
  return (
    <div className="rox-video" role="img" aria-label={`Video placeholder: ${spec}`}>
      <span className="rox-video-play">
        <svg viewBox="0 0 24 24" aria-hidden>
          <path d="M8 5v14l11-7z" />
        </svg>
      </span>
      <span className="rox-video-spec">{spec}</span>
    </div>
  );
}

/* The card X shows when a post carries an Article. Internal link, so it
   opens the article view in place rather than a new tab. */
function ArticleCard({ article }: { article: XArticle }) {
  return (
    <Link className="rox-article-card" href={article.href}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={article.cover} alt="" loading="lazy" />
      <span className="rox-article-card-body">
        <span className="rox-article-card-kicker">Article</span>
        <span className="rox-article-card-title">{article.title}</span>
        <span className="rox-article-card-meta">{article.meta}</span>
      </span>
    </Link>
  );
}

/* ── public ──────────────────────────────────────────────────────────── */

/* Mirrors react-tweet's own EmbeddedTweet composition, with the link card
   inserted where X puts it — after the text, in place of media. Composing
   by hand rather than calling EmbeddedTweet is the only way to get an
   element in there; every part around it is still react-tweet's. */
export function DraftTweet({ draft }: { draft: XDraft }) {
  // A draft has no status URL, so enrichTweet derives a dead /status/0 for
  // every link in the card. Point them at the author's account instead —
  // that covers the avatar, display name, @handle and the X logo in the
  // header, plus the timestamp, media and "Read more on X" below it.
  const profileUrl = `https://x.com/${draft.author.handle}`;
  const enriched = enrichTweet(buildTweet(draft));
  const tweet = {
    ...enriched,
    url: profileUrl,
    like_url: profileUrl,
    reply_url: profileUrl,
  };

  // The quoted post gets the same treatment. It's composed from the same
  // sub-components react-tweet's own QuotedTweet uses — but that wrapper
  // doesn't forward `components` to TweetMedia, so our local figures would
  // 404 through its twimg URL rewriting. Composing it here fixes that.
  const q = draft.quoted;
  const quoted = q
    ? {
        ...enrichTweet(buildTweet(q)),
        url: `https://x.com/${q.author.handle}`,
      }
    : null;

  return (
    <div>
      <TweetContainer>
        <TweetHeader tweet={tweet} />
        <TweetBody tweet={tweet} />
        {tweet.mediaDetails?.length ? (
          <TweetMedia tweet={tweet} components={{ MediaImg }} />
        ) : null}
        {quoted && (
          /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
          <QuotedTweetContainer tweet={quoted as any}>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <QuotedTweetHeader tweet={quoted as any} />
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <QuotedTweetBody tweet={quoted as any} />
            {quoted.mediaDetails?.length ? (
              <TweetMedia
                quoted
                /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                tweet={quoted as any}
                components={{ MediaImg }}
              />
            ) : null}
          </QuotedTweetContainer>
        )}
        {draft.video && <VideoSlot spec={draft.video.spec} />}
        {draft.card && <LinkCard card={draft.card} />}
        {draft.article && <ArticleCard article={draft.article} />}
        <TweetInfo tweet={tweet} />
        <TweetActions tweet={tweet} />
        <TweetReplies tweet={tweet} />
      </TweetContainer>
      {draft.label && (
        <div className="mt-0.5 text-left text-[0.68rem] uppercase tracking-wide text-muted/80">
          {draft.label}
        </div>
      )}
    </div>
  );
}

/* A reply chain. Each card is still a standalone embed; the connector
   between them is what makes it read as one thread, the way X runs a line
   down from a post's avatar to the reply underneath it. */
export function DraftThread({ tweets }: { tweets: XDraft[] }) {
  return (
    <div>
      {tweets.map((t, i) => (
        <div key={i}>
          <DraftTweet draft={t} />
          {i < tweets.length - 1 && (
            <span className="rox-thread-link" aria-hidden />
          )}
        </div>
      ))}
    </div>
  );
}
