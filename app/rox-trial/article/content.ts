/* Source: shriram_x_article_draft.md. Kept as a string rather than a file in
   public/ so the article can't be read around the password gate. Image paths
   point at /rox/article/; standalone **bold** lines became ## headings. */

export const ARTICLE_TITLE =
  "Why revenue agents need a knowledge graph, not a bigger model";

export const ARTICLE_MD = `Most teams building revenue agents start the same way: connect the model to Salesforce, sync it into a warehouse, let it write SQL. It works well in a demo. Ask when the Verkada deal closes and the answer is right every time.

Ask who the champion is at Groq and the agent returns a plausible name that isn't in the record.

We ran into this two years ago and bet that most of the problem sat upstream of the model. We've now measured it: 3,100 experiments, eight model families, our own production CRM. The bet held, and two results surprised us.

## Keyed vs unkeyed

The ten questions split in two.

Keyed: answerable with a foreign key. Close date, deal owner, closed-won ARR.

Unkeyed: needs a relationship Salesforce never stored. Who the champion is, how many emails with an account, how many meetings.

That is the difference between what a CRM records and what a rep asks.

| # | Question | Type |
|---|---|---|
| Q1 | Name and amount of MongoDB's active-pipeline deal, stage S1 to S5? | Keyed |
| Q2 | Close date for the Verkada deal? | Keyed |
| Q3 | Total Closed Won ARR from WSP Canada to date? | Keyed |
| Q4 | Largest active-pipeline opportunity closing April to July 2026, and who owns it? | Keyed |
| Q5 | How many distinct reps have a deal in stage S4 or S5? | Keyed |
| Q6 | Who is the champion at Groq? | Unkeyed |
| Q7 | How many distinct emails have we exchanged with Cloud Software Group? | Unkeyed |
| Q8 | How many emails have we exchanged with Blackhawk Network? | Unkeyed |
| Q9 | How many meetings have we had with Times of India? | Unkeyed |
| Q10 | Who are the champions at Bynder? | Unkeyed |

## What we ran

Both arms sit on the same Snowflake warehouse.

* Relational: the eleven Salesforce tables, the model writes SQL.
* Graph: a knowledge graph on top of the same tables. The model writes SPARQL and Ontop rewrites it to SQL. Three relationships are resolved in advance: emails to account, meetings to account, and champion.

Ground truth was hand-checked against the system of record. Eight model families from gpt-oss to Opus 4.8, 31 configurations, five iterations per question.

![Experiment architecture: both arms execute against the same Snowflake warehouse](/rox/article/fig1_architecture.png)

## 8.9% vs 99.9%

On keyed questions the arms tie at around 99%. The graph spends about 20% more tokens there, which is the cost of describing the ontology and writing SPARQL. If your questions never leave the schema, the graph doesn't help.

On unkeyed questions:

* Relational: 8.9% accuracy, 4.9 queries per run, 103.6K tokens per answer.
* Graph: 99.9% accuracy, 1.2 queries per run, 5K tokens per answer.

The best relational configuration was GPT-5.5 at 20%. The weakest graph configuration was DeepSeek at 98%.

![Accuracy by model family, keyed (left) and unkeyed (right)](/rox/article/fig5_accuracy_by_model.png)

The 8.9% is concentrated. On the three email-and-meeting questions the relational arm was correct in 0 of 465 runs. Cloud Software Group receives mail at cloud.com; filtering on that substring returns 1,491 emails against a ground truth of 883, the surplus from jumpcloud.com and icloud.com. Blackhawk Network sends from blackhawknetwork.com and bhn.com; using only the first returns 15 against at least 53, and adding the second overcounts because a subsidiary shares it. The domain-to-account map was never in the metadata, and no query recovers a mapping that was never written down.

![Per-question accuracy on unkeyed questions, relational above the line, graph below](/rox/article/fig9_unkeyed_heatmap.png)

| Queries per run | Q6 | Q7 | Q8 | Q9 | Q10 |
|---|---|---|---|---|---|
| Relational (SQL) | 5.0 | 3.5 | 3.6 | 3.0 | 9.5 |
| Graph (SPARQL) | 1.0 | 1.2 | 1.4 | 1.4 | 1.0 |

Q10 asks for the champions inside a 302-contact account. The relational arm averaged 9.5 queries per run and regularly exceeded its context window; the graph resolved it in one traversal.

## What compute buys

We raised reasoning effort expecting it to help the relational arm somewhat. GPT-5.5 from minimum to maximum effort went from 44K to 491K tokens per answer and stayed at 16%. On the champion questions higher effort made accuracy worse: the model read further into call transcripts and began treating a mention of a champion as evidence of one, so additional reasoning produced additional false positives.

A 27B open-weight model on the graph, with reasoning off, scored 100% on the same questions.

![Frontier families on unkeyed questions: accuracy (top) and tokens per run (bottom, log scale) across effort settings](/rox/article/fig14_frontier_effort.png)

## What a prompt can't carry

The other obvious fix is more context. Both arms received identical business context, including an explicit instruction to resolve meetings by attendee domain, and it made no measurable difference.

A prompt carries type-level facts: champions exist, meetings have attendees. It can't carry instance-level ones: who the champion is at a specific account, which domains belong to which company. There are thousands of those, they change weekly, and there is no way to check whether the model absorbed them. The graph stores them as rows.

## Reasoning is downstream of representation

Models are good at navigating data that is reachable and cannot recover relationships that were never recorded, and effort doesn't change which of those situations you're in.

So we resolve entities once, offline, where the result can be checked, and store the relationships as edges. Every Rox agent reads that graph rather than inferring it on each call. It's why the same models that guess on raw Salesforce hold up in production, and why the choice of model became a decision rather than a dependency for us.

## What we don't know yet

This study used three edges. Production uses hundreds: detractors, economic buyers, subsidiary roll-ups, where a champion went after a job change. We don't yet know whether the 20% keyed overhead shrinks as models get better at SPARQL, or whether reasoning starts to matter again once the graph is in place and the questions get harder than a single traversal. That's the next experiment.

Full paper, per-model tables, and the ten questions: [link]

Thanks to [authors / research team] who ran all 3,100. We're hiring.`;
