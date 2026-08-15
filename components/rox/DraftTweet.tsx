import { EmbeddedTweet } from "react-tweet";
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

export type XDraft = {
  author: XAuthor;
  text: string;
  media?: XMedia;
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
    .map((m) => ({
      display_url: m[0].replace(/^https?:\/\//, ""),
      expanded_url: m[0].startsWith("http") ? m[0] : `https://${m[0]}`,
      url: m[0],
      indices: [m.index!, m.index! + m[0].length] as [number, number],
    }));

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
  return <img {...props} src={src} />;
}

/* ── public ──────────────────────────────────────────────────────────── */

export function DraftTweet({ draft }: { draft: XDraft }) {
  return (
    <div>
      <EmbeddedTweet tweet={buildTweet(draft)} components={{ MediaImg }} />
      {draft.label && (
        <div className="mt-0.5 text-left text-[0.68rem] uppercase tracking-wide text-muted/80">
          {draft.label}
        </div>
      )}
    </div>
  );
}

export function DraftThread({ tweets }: { tweets: XDraft[] }) {
  return (
    <div className="flex flex-col gap-4">
      {tweets.map((t, i) => (
        <DraftTweet draft={t} key={i} />
      ))}
    </div>
  );
}
