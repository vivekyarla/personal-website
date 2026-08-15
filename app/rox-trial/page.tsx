import Link from "next/link";
import Clock from "@/components/Clock";
import RoxGate from "@/components/rox/RoxGate";
import { TweetCard, TweetThread } from "@/components/rox/DraftTweet";
import { requireRoxAuth } from "@/lib/session";
import {
  AVANIKA_METHOD,
  ISHAN_QT,
  OPEN_HOUSE,
  RECEIPTS,
  STEELMAN,
  THREAD,
} from "./content";

export const metadata = {
  title: "Rox · X strategy",
  robots: { index: false, follow: false },
};

const heading =
  process.env.NODE_ENV === "development"
    ? "font-serif font-normal"
    : "font-semibold";

function H2({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <h2 className={`text-base tracking-tight ${heading}`}>
      <span className="mr-2 text-[0.72rem] text-muted/70 tabular-nums align-middle">
        {n}
      </span>
      {children}
    </h2>
  );
}

export default async function RoxTrial() {
  if (!(await requireRoxAuth())) return <RoxGate />;

  return (
    <div className="relative waterfall flex flex-col text-[0.9rem] pt-[clamp(1.5rem,7vh,6rem)] pb-24">
      <div className="absolute top-6 left-0">
        <Link
          href="/"
          className="text-xs text-muted/70 hover:text-foreground transition-colors"
        >
          ← vivekyarla.com
        </Link>
      </div>

      <header className="mb-8 flex items-baseline justify-between gap-3">
        <h1 className={`text-2xl tracking-tight ${heading}`}>Rox · X strategy</h1>
        <Clock />
      </header>

      <p className="leading-relaxed">
        Getting{" "}
        <em>
          Empirical Analysis of Agentic Retrieval: Knowledge Graphs vs.
          Relational Schemas in CRM Workflows
        </em>{" "}
        to 100K organic views.
      </p>
      <p className="mt-3 leading-relaxed text-muted">
        One thing worth saying up front, because it shaped everything below: a
        thread doesn&apos;t reach 100K views because the copy is good. It reaches
        100K because fifteen to twenty-five accounts with real followings quote
        it in the first three hours, and each of those quotes opens a new
        timeline. The copy&apos;s job is to make quoting it irresistible and
        cheap — one screenshot, one number, one argument you can add your take
        to. So the thread is built out of standalone, screenshot-shaped posts,
        and the plan around it is mostly about manufacturing those first
        twenty quotes rather than hoping for them.
      </p>
      <p className="mt-3 leading-relaxed text-muted">
        The paper hands us three separate audiences and I&apos;ve aimed a
        different artifact at each: a 27B model beating frontier models (the
        open-weights crowd), reasoning effort buying nothing (the test-time
        compute argument), and cloud.com quietly returning 1,491 emails instead
        of 883 (everyone who has ever touched enterprise data). Same paper,
        three front doors.
      </p>

      <hr className="rox-rule" />

      <H2 n="01">The main thread</H2>
      <p className="mt-2 mb-1 text-[0.8rem] leading-relaxed text-muted">
        Posted from{" "}
        <span className="text-foreground">@rox_ai</span>, Tuesday 9:05am PT.
        Thirteen posts. No hashtags, no thread emoji, no link until the last
        one — the link is what suppresses reach on the first post, and the first
        post is the only one the algorithm is really scoring.
      </p>
      <p className="mb-5 text-[0.72rem] text-muted/80">
        Charts are the paper&apos;s own figures, captions cropped. Click any one
        to open it full size.
      </p>

      <TweetThread tweets={THREAD} />

      <p className="mt-4 text-[0.8rem] leading-relaxed text-muted">
        Posts 1, 5 and 7 are the designed exit points — each is complete on its
        own, so someone can screenshot it without the thread and it still makes
        the argument. Post 3 gives away that the graph is more expensive on the
        easy half before anyone can catch us hiding it; that single admission is
        what makes the other twelve posts credible, and in my experience it is
        the line that gets quoted by the people you most want quoting you.
      </p>

      <hr className="rox-rule" />

      <H2 n="02">Strategy beyond the thread</H2>
      <p className="mt-2 mb-6 text-[0.8rem] leading-relaxed text-muted">
        The rule I&apos;d hold everyone to: one flagship artifact per day for
        seven days, never two competing on the same day, and every link in a
        reply rather than a top-level post.
      </p>

      <h3 className="mb-2 text-[0.8rem] font-semibold tracking-tight">
        Before launch
      </h3>
      <div className="mb-8 overflow-x-auto">
        <table className="rox-table">
          <thead>
            <tr>
              <th>When</th>
              <th>Who</th>
              <th>What</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>T−5 days</td>
              <td>Vivek / comms</td>
              <td>
                Paper goes out under embargo to ~12 people who will actually
                read it, as a PDF with a note on what&apos;s surprising in it,
                not a press release. This is the highest-leverage act in the
                whole plan: you cannot manufacture 100K views from a cold post,
                but you can manufacture eight informed quote-tweets in hour one.
              </td>
            </tr>
            <tr>
              <td>T−3 days</td>
              <td>@Avanika15</td>
              <td>
                Teaser with the result withheld: one chart, arms unlabelled,
                &ldquo;one of these two bars is a 27B open-weight model and the
                other is a frontier model, and the answer is going to annoy
                people.&rdquo; Researcher account, curiosity gap, no link.
              </td>
            </tr>
            <tr>
              <td>T−2 days</td>
              <td>Vivek / comms</td>
              <td>
                Newsletters get the chart and three sentences (not the PDF):
                TLDR AI, AlphaSignal, Ben&apos;s Bites, The Batch, Latent Space.
                They run on 48-hour lead times, so this has to happen before,
                not after.
              </td>
            </tr>
            <tr>
              <td>T−1 day</td>
              <td>Everyone posting</td>
              <td>
                Copy is written and scheduled, including the employee
                quote-tweets — each personalised, staggered across the day.
                Twenty identical reposts in ten minutes reads as coordinated and
                gets damped.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 className="mb-2 text-[0.8rem] font-semibold tracking-tight">
        Launch day
      </h3>
      <div className="mb-6 overflow-x-auto">
        <table className="rox-table">
          <thead>
            <tr>
              <th>When</th>
              <th>Who</th>
              <th>What</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>9:05am PT</td>
              <td>@rox_ai</td>
              <td>The thread. Tuesday or Wednesday, never Monday or Friday.</td>
            </tr>
            <tr>
              <td>+5 min</td>
              <td>@ishanmkh</td>
              <td>
                Quote-tweet, not a repost — a QT from the larger account with
                original text is a new post to the algorithm, a repost is
                nearly nothing. His framing is the business one, not the
                research one.
              </td>
            </tr>
            <tr>
              <td>+20 min</td>
              <td>@Avanika15</td>
              <td>
                Her own separate thread on method: why we reused Sequeda et
                al.&apos;s 2023 setup, what we changed, and what she&apos;d
                attack about our own result. Second surface for the algorithm,
                and it inoculates against the &ldquo;vendor benchmark&rdquo;
                dunk before it arrives.
              </td>
            </tr>
            <tr>
              <td>+1 hr</td>
              <td>Chris Ré</td>
              <td>
                One post. This is the single biggest credibility asset Rox has
                and it should be spent on exactly one sentence — representation
                beating compute is the oldest lesson in ML and here it is again,
                measured. It reaches the academic ML timeline, which nothing
                else on this list does.
              </td>
            </tr>
            <tr>
              <td>+2 hr</td>
              <td>Shriram Sridharan</td>
              <td>
                The infrastructure angle: what offline entity resolution
                actually costs to build and run, why it belongs at build time,
                what breaks when you move it to query time. Lands with data
                engineers, who are a different timeline entirely.
              </td>
            </tr>
            <tr>
              <td>+4 hr</td>
              <td>Diogo Ribeiro</td>
              <td>
                The GTM version, and the one I&apos;d also put on LinkedIn:
                champion, detractor, economic buyer, which subsidiary rolls up
                where, where your champion went after they left. None of those
                are a domain rule. All of them are an edge.
              </td>
            </tr>
            <tr>
              <td>First 4 hrs</td>
              <td>@rox_ai</td>
              <td>
                Someone replies to every substantive reply, from the company
                account, by hand. Reply velocity in the first hours is the
                heaviest thing the ranker weighs, and it is the one input
                entirely under our control.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-4">
        <TweetCard draft={ISHAN_QT} />
        <TweetCard draft={AVANIKA_METHOD} />
      </div>

      <h3 className="mt-8 mb-2 text-[0.8rem] font-semibold tracking-tight">
        Days two through seven
      </h3>
      <p className="mb-4 text-[0.8rem] leading-relaxed text-muted">
        This is where most of the 100K actually comes from. A thread is one
        post; the week after is seven more chances, each aimed at a timeline the
        thread didn&apos;t reach.
      </p>
      <div className="mb-6 overflow-x-auto">
        <table className="rox-table">
          <thead>
            <tr>
              <th>Day</th>
              <th>Format</th>
              <th>What and why</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>2</td>
              <td>Native video</td>
              <td>
                Sixty seconds, no link: the same question failing in the SQL arm
                and resolving in a single traversal in the graph arm, screen
                recorded. Native video is the highest-reach format on X right
                now and the demo is genuinely more convincing than the chart.
              </td>
            </tr>
            <tr>
              <td>3</td>
              <td>Standalone post</td>
              <td>
                The cloud.com receipts, pulled out of position five in the
                thread and given its own life. This is the most screenshot-able
                thing in the paper and it should not be buried.
              </td>
            </tr>
            <tr>
              <td>4</td>
              <td>Repo</td>
              <td>
                Publish the ten questions, the OWL vocabulary, the eighteen edge
                types and the grading rubric. A repo gives the work a second
                life on Hacker News and gives other people a reason to post
                their own numbers, which is the cheapest reach there is.
              </td>
            </tr>
            <tr>
              <td>5</td>
              <td>Steelman</td>
              <td>
                Post the strongest objection to our own result and answer it in
                public. Pre-empting the dunk converts would-be critics into
                repliers, and repliers are distribution.
              </td>
            </tr>
            <tr>
              <td>6</td>
              <td>Counter-programme</td>
              <td>
                One post about where the graph <em>loses</em> — the 20% token
                overhead on keyed questions, the build-time cost, the fact that
                none of this helps if your questions are all foreign keys. Costs
                nothing, buys an enormous amount of trust, and reliably produces
                the &ldquo;refreshing to see a vendor publish this&rdquo; quotes.
              </td>
            </tr>
            <tr>
              <td>7</td>
              <td>Chart of the day</td>
              <td>
                Each remaining figure reposted standalone with a one-line
                caption, one per day, running underneath everything else.
                Charts travel further than threads and cost nothing to make.
              </td>
            </tr>
            <tr>
              <td>Ongoing</td>
              <td>Replies</td>
              <td>
                For two weeks, whenever anyone posts &ldquo;MCP is all you
                need&rdquo; or &ldquo;agents can&apos;t handle enterprise
                data&rdquo;, reply with the one relevant chart. A chart, not a
                link. From the individual accounts more often than the company
                one.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-4">
        <TweetCard draft={RECEIPTS} />
        <TweetCard draft={OPEN_HOUSE} />
        <TweetCard draft={STEELMAN} />
      </div>

      <hr className="rox-rule" />

      <H2 n="03">Distribution notes</H2>

      <h3 className="mt-5 mb-2 text-[0.8rem] font-semibold tracking-tight">
        Who to loop in, and why them
      </h3>
      <ul className="flex flex-col gap-2.5 text-[0.82rem] leading-relaxed text-muted">
        <li>
          <span className="text-foreground">@juansequeda and @dallemang</span>{" "}
          — they are reference [1]. Tag them in the post that cites their 2023
          benchmark, and send the paper early. A company replicating your
          academic result on production data is a gift; they will amplify it,
          and they carry the entire knowledge-graph community, which is small
          but unusually high-engagement on precisely this claim. Juan&apos;s
          podcast is also the single most natural venue for a long-form version.
        </li>
        <li>
          <span className="text-foreground">The Ontop authors</span> (Calvanese,
          Xiao, and co.) — we used their engine and cited it. Same logic, second
          community.
        </li>
        <li>
          <span className="text-foreground">
            @swyx, @simonw, @HamelHusain, @jxnlco, @eugeneyan
          </span>{" "}
          — the people who read papers properly and whose quote-tweets set what
          the AI-engineering timeline talks about that week. Embargo copies, not
          launch-day tags.
        </li>
        <li>
          <span className="text-foreground">@deedydas and @rohanpaul_ai</span> —
          high-volume accounts whose entire format is &ldquo;here is a
          surprising benchmark result.&rdquo; The 27B-beats-frontier framing is
          native to what they already post.
        </li>
        <li>
          <span className="text-foreground">@omarsar0, @TheTuringPost, @_philschmid</span>{" "}
          — reliable second-wave amplification for research threads, day two or
          three rather than day one.
        </li>
        <li>
          <span className="text-foreground">Sequoia and General Catalyst</span>{" "}
          — their firm accounts and the partners on the deal. Ask for a QT, not
          a repost, and give them the line you want them to use. Sequoia already
          has the &ldquo;every seller needs an agent swarm&rdquo; piece to
          connect it to.
        </li>
        <li>
          <span className="text-foreground">Anyone from the MCP world</span> —
          the thread names MCP directly, so the honest move is to tag in the
          people building it rather than subtweet them. Framed as
          &ldquo;connectivity solved, representation didn&apos;t,&rdquo; it&apos;s
          a contribution to their conversation, not an attack on it.
        </li>
      </ul>

      <h3 className="mt-7 mb-2 text-[0.8rem] font-semibold tracking-tight">
        Off X, in service of X
      </h3>
      <ul className="flex flex-col gap-2.5 text-[0.82rem] leading-relaxed text-muted">
        <li>
          <span className="text-foreground">Hacker News</span> — submit the
          paper itself the morning after launch, then a first comment as the
          authors. If it holds the front page for four hours it will do more X
          traffic than any single post we write.
        </li>
        <li>
          <span className="text-foreground">r/LocalLLaMA</span> — the
          27B-open-weight-model-beats-frontier result is native to that
          subreddit and it converts to X follows better than almost anywhere
          else. r/dataengineering gets the entity-resolution framing instead.
        </li>
        <li>
          <span className="text-foreground">20VC</span> — Harry Stebbings has
          already had Ishan on. A ten-minute follow-up clip on this one result
          is a cheap ask and gives us a second piece of video for the week.
        </li>
        <li>
          <span className="text-foreground">LinkedIn</span> — a different
          audience, and the one that actually buys. Diogo owns it; the GTM
          framing, not the research framing.
        </li>
      </ul>

      <h3 className="mt-7 mb-2 text-[0.8rem] font-semibold tracking-tight">
        What I&apos;d watch, and what I wouldn&apos;t do
      </h3>
      <p className="text-[0.82rem] leading-relaxed text-muted">
        The number I&apos;d actually track on day one isn&apos;t views, it&apos;s
        quote-tweets from accounts over 20K followers — if that&apos;s under
        eight by hour three, the thread isn&apos;t going to get there on its own
        and we should spend the day working replies and DMs rather than posting
        more. Views follow that number; they don&apos;t lead it.
      </p>
      <p className="mt-3 text-[0.82rem] leading-relaxed text-muted">
        Things I&apos;d refuse: hashtags, thread emoji, &ldquo;comment GRAPH and
        I&apos;ll DM you the paper&rdquo;, and paid amplification in week one.
        The last one matters most — promoting a research post reads as
        defensive, and it teaches the ranker that the post needed help.
      </p>
    </div>
  );
}
