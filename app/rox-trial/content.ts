import type { XAuthor, XDraft, XMedia } from "@/components/rox/DraftTweet";

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

const FIG: Record<string, XMedia> = {
  accuracy: {
    src: "/rox/fig-accuracy.png",
    alt: "Accuracy by model, keyed vs unkeyed questions, relational vs graph",
    width: 1400,
    height: 520,
  },
  architecture: {
    src: "/rox/fig-architecture.png",
    alt: "Experiment architecture: one MCP client, two arms, one warehouse",
    width: 1400,
    height: 902,
  },
  grid: {
    src: "/rox/fig-unkeyed-grid.png",
    alt: "Per-question accuracy on unkeyed questions, SQL above the line and KG below",
    width: 1400,
    height: 683,
  },
  tokens: {
    src: "/rox/fig-tokens.png",
    alt: "Tokens per run, log scale, keyed and unkeyed questions",
    width: 1400,
    height: 523,
  },
  effort: {
    src: "/rox/fig-effort.png",
    alt: "Frontier model reasoning effort vs accuracy and token spend",
    width: 1400,
    height: 609,
  },
};

/* Launch is Tuesday 18 Aug 2026, 9:05am PT. Each post in the thread lands a
   minute after the one before it, the way a real thread posts. */
const LAUNCH = Date.UTC(2026, 7, 18, 16, 5);
const at = (minutesAfterLaunch: number) =>
  new Date(LAUNCH + minutesAfterLaunch * 60_000).toISOString();

/* ── The main thread ──────────────────────────────────────────────────── */

const t = (text: string, media?: XMedia): XDraft => ({
  author: ROX,
  text,
  media,
  postedAt: "",
});

export const THREAD: XDraft[] = [
  t(
    `A 27B open-weight model just beat GPT-5.5, Claude Opus 4.8 and Sonnet 5 at answering questions about our own CRM.

Same warehouse. Same questions. Same business context in the prompt.

8.9% → 99.9%.

The only thing that changed was how the data was represented.`,
    FIG.accuracy
  ),

  t(
    `3,100 runs. 31 configurations across 8 model families. 10 questions pulled from our own revenue workflows, graded by an independent judge against our production system of record.

Two arms, one Snowflake:

SQL over 11 Salesforce tables
SPARQL over a graph of the same rows`,
    FIG.architecture
  ),

  t(`Five of the questions are answerable with a foreign key. "What's the close date on the Verkada deal." Both arms score ~99% — and the graph is the more expensive one, by about 20% in tokens.

Five aren't. "Who's the champion at Bynder."

That's where everything happens.`),

  t(
    `Unkeyed questions, pooled across every model and setting:

relational (SQL) — 8.9% accurate · 4.91 queries · 103.6K tokens
graph (SPARQL) — 99.9% accurate · 1.21 queries · 5.0K tokens

11x the accuracy at a twentieth of the cost.`,
    FIG.grid
  ),

  t(`One failure worth sitting with.

Cloud Software Group gets mail at cloud.com. Filter on that domain and you return 1,491 emails. The true number is 883.

The other 608 belong to jumpcloud.com and icloud.com — companies that happen to end in the same nine characters.`),

  t(`Blackhawk Network fails in both directions at once.

They send from blackhawknetwork.com and from bhn.com. Match the first and you return 15 against a ground truth of 53. Add the second and you overcount, because a subsidiary uses it too.

No domain rule gets this right.`),

  t(`The obvious fix is a better model. It isn't.

Unkeyed accuracy — reasoning ON over tables, reasoning OFF over the graph:

MiniMax M3 · 16% → 100%
Qwen3.6 27B · 16% → 100%
DeepSeek V4-Pro · 8% → 100%
Sonnet 5 · 9% → 100%
Opus 4.8 · 9% → 100%`),

  t(
    `We gave GPT-5.5 more room to think. Minimum to maximum effort took it from 44K tokens to 491K.

Accuracy didn't move.

Past a point it got worse — the deeper it searched transcripts, the more it mistook someone being mentioned in a meeting for someone being the champion.`,
    FIG.effort
  ),

  t(`The standard objection: just write the context down. Put it in the system prompt, put it in a skill file, let the model reason from there.

We tested exactly that. Both arms got identical business context, including explicit instructions to resolve meetings by attendee domain.

The relational arm still failed.`),

  t(`Because a prompt carries type-level knowledge — that a champion relationship exists, and what it connects.

It can't carry instance-level facts: who the champion is, which subsidiary rolls up to which parent, where that champion went after they changed jobs.

High cardinality, changes weekly, untestable in a paragraph.`),

  t(`This is the part we think is missing from the MCP conversation.

More servers give an agent more surface area, not more understanding. Each one arrives with its own schema tax, and none of them resolve entities across each other.

Resolution is a separate job. It runs once, offline, where a human can check it.`),

  t(`And the number that should worry you isn't the 8.9%.

It's that the other 91% came back fluent, sourced and confident. Nothing in the loop flags it.

In a revenue workflow that's a forecast someone acts on Monday morning.`),

  t(`Full paper — all 31 configurations, the 10 questions, the ontology, and every failure mode we hit:

rox.com/research/agentic-retrieval

Short version: we built the knowledge graph before we built the agents. This is why.`),
].map((draft, i) => ({ ...draft, postedAt: at(i) }));

/* ── Next steps ───────────────────────────────────────────────────────
   Scaffold only. Group headings are placeholders — rename, reorder, drop
   or add them. A group with no items renders as a bare heading, so the
   section fills in as items get written. */

export type NextStepGroup = {
  heading: string;
  items: string[];
};

export const NEXT_STEPS: NextStepGroup[] = [
  { heading: "Questions for the research team", items: [] },
  { heading: "Questions for GTM", items: [] },
  { heading: "What I'd want to run first", items: [] },
];

/* ── Additional posts ─────────────────────────────────────────────────── */

export const ADDITIONAL: XDraft[] = [
  {
    author: ISHAN,
    postedAt: at(5),
    label: "Quote-tweeting @rox_ai · T+5 min",
    text: `For two years the question we got most was why we bothered building a knowledge graph instead of pointing an LLM at Salesforce like everyone else.

Here's the answer, measured on our own production CRM, against the best models that exist.

The model was never the bottleneck.`,
  },
  {
    author: AVANIKA,
    postedAt: at(20),
    label: "T+20 min",
    text: `Some notes on how we ran this, because "vendor benchmarks own product" deserves scrutiny.

We deliberately reused the setup from Sequeda, Allemang & Jacob (2023): virtualize an ontology over the relational schema, zero-shot, each arm gets its own native schema description. Same shape, new models.

What I'd attack about our result, and what survived:`,
  },
  {
    author: ROX,
    postedAt: at(60 * 48),
    label: "Day 3",
    text: `Cloud Software Group gets mail at cloud.com.

Point an agent at that domain and it returns 1,491 emails. The real number is 883.

The extra 608 are jumpcloud.com and icloud.com.

This one substring is the entire reason "just connect the CRM" doesn't work.`,
    media: FIG.grid,
  },
  {
    author: ROX,
    postedAt: at(60 * 72),
    label: "Day 4",
    text: `We put the benchmark up: the 10 questions, the OWL vocabulary, the 18 edge types, and the grading rubric the judge used.

If your agent gets more than 8.9% on the unkeyed five without a resolution layer, we want to see the trace.

github.com/rox-ai/agentic-retrieval-bench`,
    media: FIG.tokens,
  },
  {
    author: AVANIKA,
    postedAt: at(60 * 96),
    label: "Day 5",
    text: `Best critique we've had so far: you picked the questions and you wrote the ontology, so of course the graph wins.

Fair. Two answers.

The five keyed questions are the control, and the graph loses them — it costs 20% more tokens for the same answer.

And the ontology is in the paper. Point it at your CRM and tell us we're wrong.`,
  },
];
