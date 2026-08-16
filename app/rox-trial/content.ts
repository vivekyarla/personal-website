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

More context: both arms got the same business context, including instructions to resolve meetings by attendee domain. It didn't help. A prompt can say champions exist. It can't say who they are.`,
  },
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
