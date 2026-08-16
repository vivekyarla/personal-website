import type { XAuthor, XDraft } from "@/components/rox/DraftTweet";
import type { TweetWithCategory } from "@/lib/tweets";

export const ROX: XAuthor = {
  name: "Rox",
  handle: "rox_ai",
  avatar: "/rox/av-rox_ai.jpg",
};

export const ISHAN: XAuthor = {
  name: "Ishan Mukherjee",
  handle: "ishanmkh",
  avatar: "/rox/av-ishanmkh.jpg",
};

export const AVANIKA: XAuthor = {
  name: "Avanika Narayan",
  handle: "Avanika15",
  avatar: "/rox/av-avanika15.jpg",
};

export const SHRIRAM: XAuthor = {
  name: "Shriram Sridharan",
  handle: "shriram_s",
  avatar: "/rox/av-shriram_s.jpg",
};

/* Launch is Tuesday 18 Aug 2026, 9:05am PT — midweek, as the timeline calls
   for. Each post in the thread lands a minute after the one before it, the
   way a real thread posts. Every other timestamp below is derived from this
   so the cards agree with the timeline in section 03. */
const LAUNCH = Date.UTC(2026, 7, 18, 16, 5);
const at = (minutesAfterLaunch: number) =>
  new Date(LAUNCH + minutesAfterLaunch * 60_000).toISOString();
const hours = (h: number) => h * 60;
const days = (d: number) => d * 24 * 60;

/* ── The main thread ──────────────────────────────────────────────────── */

export const THREAD: XDraft[] = [
  {
    author: ROX,
    postedAt: "",
    text: `AI sales agents don't fail on hard questions. They fail on the ones the CRM never recorded.

"When does the Verkada deal close?" Nails it. "Who's our champion at Groq?" It makes one up, confidently.

We ran 3,100 experiments across every frontier model to find out why. The answer? It isn't the model, and it isn't the amount of compute.

Swap raw Salesforce for a knowledge graph and accuracy jumps from 8.9% to 99.9%, with a 27B open-weight model getting there at a twentieth of the cost.

Reasoning is downstream of representation. For revenue agents, the edge isn't a bigger model, it's a system of record for relationships. Every Rox agent runs on one.

Full paper below.`,
    media: {
      src: "/rox/fig-11x-accuracy.png",
      alt: "11x more accurate on the questions that matter — unkeyed accuracy per model, raw Salesforce 8.9% average vs knowledge graph 99.9% average",
      width: 1512,
      height: 1004,
    },
  },

  {
    author: ROX,
    postedAt: "",
    text: `1/ Full paper: https://docs.google.com/document/d/1DpkVCJPsjDZVCqQZS1Xu-_3KCFGtRy_XwNXC5vZgmVM/edit?tab=t.0#heading=h.nveo3sf169tx

We used the same warehouse and the same ten questions, with ground truth checked against our own production CRM. One arm writes SQL against raw Salesforce. The other queries a knowledge graph on top of it, with three relationships resolved in advance: emails to account, meetings to account, and champion. Eight model families, 31 configurations, 3,100 runs.`,
    media: {
      src: "/rox/fig-architecture-dark.png",
      alt: "Experiment architecture: one MCP client reaching a raw SQL MCP server and a knowledge graph MCP server, both executing against the same Salesforce data",
      width: 1536,
      height: 1024,
    },
  },

  {
    author: ROX,
    postedAt: "",
    text: `2/ We tried the two obvious fixes before touching the data.

More compute: GPT-5.5 at max effort went from 44K to 491K tokens per answer and stayed at 16%.

More context: both arms got the same business context, including instructions to resolve meetings by attendee domain. It didn't help. A prompt can say champions exist, but it can't say who they are.`,
  },

  {
    author: ROX,
    postedAt: "",
    text: `3/ Once the relationships exist as data, the model stops mattering much. Every family we tested hit 98–100% on the graph, in about one query, at a twentieth of the tokens. Nothing on raw Salesforce broke 20%.

That's what runs under every Rox agent: entity resolution done once, offline, stored as edges the model reads instead of infers.

For revenue agents, this means the graph is the thing to build. Once you have it, the model is a choice: swap it, run an open one, spend less. The map is the moat.`,
  },
].map((draft, i) => ({ ...draft, postedAt: at(i) }));

/* ── Launch timeline ──────────────────────────────────────────────────── */

export type TimelineEntry = {
  day: string;
  title: string;
  body: string;
};

export const TIMELINE: TimelineEntry[] = [
  {
    day: "Day 0",
    title: "Anchor thread, @rox_ai",
    body: "Anchor with the dumbbell chart, then the three replies. Goes first because everything else quote-tweets or builds on it. Midweek launch, so it has the full week of conversation ahead of it.",
  },
  {
    day: "Day 0",
    title: "Ishan QT",
    body: "One line quote-tweeting the anchor, within the first hour. A founder QT gets the anchor into his followers' feeds while it's still ranking, and it's the cheapest reach multiplier available.",
  },
  {
    day: "Day 0",
    title: "Shriram X Article",
    body: "Short post above the card, full Article underneath, later the same day. Catches the people who saw the finding and want the engineering, and gives the technical audience their own native object to share.",
  },
  {
    day: "Day 0–1",
    title: "Authors' and engineers' personal posts",
    body: "Organic one-liners from the people who ran it, spread across the first 24 hours rather than all at once, so the paper keeps surfacing in different feeds.",
  },
  {
    day: "Day 1–2",
    title: "Replies and QTs",
    body: "Shriram on technical, Ishan on strategy, company account on facts. Most of a research post's reach happens in the first 48 hours of conversation.",
  },
  {
    day: "Day 3–5",
    title: "Case study video, @rox_ai, Ishan QT",
    body: "After the paper has landed, so the human story reads as proof of a finding people have already seen and not as a marketing clip that happens to be near a paper.",
  },
];

/* ── Additional posts ─────────────────────────────────────────────────── */

/* Add drafts here and they render as standalone cards, with `label` showing
   as a caption underneath (e.g. "Day 3", "T+20 min"). The ISHAN and AVANIKA
   authors above are ready if you want posts from them. Paper figures are
   still in public/rox/ if you want to attach one: fig-accuracy,
   fig-architecture, fig-unkeyed-grid, fig-tokens, fig-effort. */
export const ADDITIONAL: XDraft[] = [];

/* Real posts, embedded live through the same path /repository uses. The
   carousel wants DB-shaped rows, so these are the minimum that satisfies it. */
export const asCarouselTweet = (url: string): TweetWithCategory => ({
  id: url,
  url,
  embed_html: null,
  author_name: null,
  author_url: null,
  category_id: null,
  note: null,
  tweet_posted_at: null,
  created_at: "2026-08-18T00:00:00.000Z",
  category: null,
});

export const BLAND_TWEET = "https://x.com/usebland/status/2084685910667649324";
export const STORYTELLING_TWEETS = [
  "https://x.com/jxnlco/status/2082855170296205719",
  "https://x.com/bot/status/2087224798078517251",
  "https://x.com/rox_ai/status/2075256586940080250",
].map(asCarouselTweet);

export const CASE_STUDY_POST: XDraft = {
  author: ROX,
  // Timeline: Day 3–5. Day 3 is the only weekday in that window.
  postedAt: at(days(3)),
  text: `Salesforce said the account was dead. It wasn't.

For eight months, one of [Customer]'s biggest accounts had been quietly emailing from a subsidiary domain nobody had mapped. The CRM saw silence. [Rep] was about to write it off in his QBR.

Rox's agent had already resolved the domain, and surfaced 53 threads the CRM couldn't see. He kept the account, made his number, and this is him telling it.`,
  video: { spec: "45–60s · phone-shot · no music" },
};

/* Quote-tweets the anchor post, so it embeds THREAD[0] verbatim. */
export const ISHAN_QT: XDraft = {
  author: ISHAN,
  // Timeline: within the first hour of the anchor.
  postedAt: at(40),
  text: `Everyone in revenue AI is racing to the next model. The gap we found is in how the data is represented, and it doesn't close with a bigger model. Great work from @shriram_s and the research team at @rox_ai`,
  quoted: THREAD[0],
};

export const SHRIRAM_POST: XDraft = {
  author: SHRIRAM,
  // Timeline: later the same day, after the QT has run.
  postedAt: at(hours(5)),
  text: `Rox agents don't read the CRM. They read a knowledge graph on top of it, with champions, domains, and subsidiaries resolved before any model is involved. We benchmarked against raw Salesforce across 8 model families and 3,100 runs. A 27B open-weight model on the graph beats GPT-5.5 on the tables. Reasoning effort didn't close the gap. Here is the run-down from the paper:`,
  article: {
    href: "/rox-trial/article",
    title: "Why revenue agents need a knowledge graph, not a bigger model",
    cover: "/rox/article/fig1_architecture.png",
    meta: "shriram_s · 6 min read",
  },
};
