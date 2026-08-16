import Link from "next/link";
import Clock from "@/components/Clock";
import RoxGate from "@/components/rox/RoxGate";
import { DraftThread, DraftTweet } from "@/components/rox/DraftTweet";
import { requireRoxAuth } from "@/lib/session";
import RepoTweet from "@/components/RepoTweet";
import TweetCarousel from "@/components/TweetCarousel";
import { tweetIdFromUrl } from "@/lib/tweets";
import {
  ADDITIONAL,
  BLAND_TWEET,
  CASE_STUDY_POST,
  ISHAN_QT,
  SHRIRAM_POST,
  STORYTELLING_TWEETS,
  THREAD,
  TIMELINE,
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
    <h2 className={`text-xl tracking-tight ${heading}`}>
      <span className="mr-2 text-[0.85rem] text-muted/70 tabular-nums align-middle">
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
        <strong className="font-semibold">Goal:</strong>{" "}
        get Rox&apos;s paper on knowledge graphs in CRM workflows to 100K
        organic views.
      </p>

      <hr className="rox-rule" />

      <H2 n="01">The main thread</H2>
      <p className="mt-3 leading-relaxed text-muted">
        I started with an anchor post that goes up first on the main account.
        It has a dumbbell chart as native media, then three short replies with
        the paper link in the first. I modeled the format on how Ramp Labs and
        Thinking Machines post research: one strong claim about the world in
        the first line, one number the reader can check, and the product as a
        fact in the last sentence rather than a pitch. This should be the main
        native content that gets quote-tweeted by people outside Rox&apos;s
        audience and tees up follow-up posts from other accounts.
      </p>
      <div className="mt-6">
        <DraftThread tweets={THREAD} />
      </div>

      <hr className="rox-rule" />

      <H2 n="02">Additional posts</H2>

      <h3 className="mt-6 mb-3 text-[0.95rem] font-semibold tracking-tight">
        Case study
      </h3>
      <DraftTweet draft={CASE_STUDY_POST} />

      <h4 className="mt-7 mb-2 text-[0.85rem] font-semibold tracking-tight">
        Approach
      </h4>
      <p className="leading-relaxed text-muted">
        The story here should be about a person, not an account. Every Rox
        customer story so far has been a logo and a metric. For this one, I&apos;d
        want to go deeper, focus on one named character, their stakes, and a
        moment where the graph knew something they didn&apos;t. A good litmus
        test for the story is whether it&apos;s something you&apos;d tell at
        dinner; if it belongs in a QBR it isn&apos;t the one. I&apos;d go to the
        customer team and ask for the coolest stories they&apos;ve heard from
        reps in the last year. Some examples of what I&apos;d be looking for:
      </p>
      <ul className="mt-3 flex flex-col gap-2.5 pl-5 list-disc leading-relaxed text-muted">
        <li>
          A rep who was close to being managed out found that one of his
          &ldquo;dead&rdquo; accounts had been active the whole time, emailing
          from a subsidiary domain nobody had mapped. The agent surfaced it, he
          saved the account, and made his number.
        </li>
        <li>
          A rep and her champion became friends over three years of working
          together. The champion changed jobs and Salesforce never updated. The
          agent resolved his new email at a company they&apos;d never sold to,
          she reached out, and closed a deal there. They&apos;re still friends.
        </li>
        <li>
          A rep in another time zone woke up to a message from the agent: the
          champion at a big account had changed jobs overnight, here&apos;s
          where they went and who on the buying committee is still there. A
          deal he didn&apos;t know existed by breakfast.
        </li>
      </ul>
      <p className="mt-3 leading-relaxed text-muted">
        How the video flows: open on the person and the problem in their words,
        no logo, no b-roll. Middle is the moment the agent showed them something
        they didn&apos;t know, shown as one screenshot of the actual message.
        Close is what happened after in one sentence, and the Rox mark appears
        only in the last few seconds.
      </p>

      <h4 className="mt-7 mb-2 text-[0.85rem] font-semibold tracking-tight">
        Inspiration
      </h4>
      <p className="leading-relaxed text-muted">
        The Bland AI Speech v3 launch is the model for this. They shipped a
        voice model that topped a realism benchmark, and the tweet gave that one
        line before handing the whole thing to James, a 49-year-old father who
        lost his voice to a stroke, hearing himself again from five seconds of
        old footage. It worked because nothing in it was about voice AI. It was
        about a human moment enabled by the product. That&apos;s the exact shape
        I want for Rox: the paper says the finding, the video shows one person it
        happened to. Even if not for this paper specifically, I&apos;d love to do
        something like this for a different research or product launch.
      </p>
      <div className="mt-4">
        <RepoTweet id={tweetIdFromUrl(BLAND_TWEET)!} url={BLAND_TWEET} />
      </div>

      <p className="mt-6 leading-relaxed text-muted">
        For general storytelling I&apos;d also draw from a few other standalone
        launch videos and ads that put people before the product and do it in a
        compelling way:
      </p>
      <div className="mt-4 rox-carousel-center">
        <TweetCarousel tweets={STORYTELLING_TWEETS} />
      </div>

      <h3 className="mt-10 mb-3 text-[0.95rem] font-semibold tracking-tight">
        Ishan Mukherjee
      </h3>
      <DraftTweet draft={ISHAN_QT} />

      <h4 className="mt-7 mb-2 text-[0.85rem] font-semibold tracking-tight">
        Approach
      </h4>
      <p className="leading-relaxed text-muted">
        Ishan quote-tweets the anchor within the first hour. Founder accounts
        travel further than brand accounts on X, and a QT this early gets the
        anchor into his followers&apos; feeds while it&apos;s still ranking. The
        line should read as a general takeaway from the paper and is intended to
        be the bridge between the content and non-research audiences.
      </p>

      <h3 className="mt-10 mb-3 text-[0.95rem] font-semibold tracking-tight">
        Shriram Sridharan
      </h3>
      <DraftTweet draft={SHRIRAM_POST} />

      <h4 className="mt-7 mb-2 text-[0.85rem] font-semibold tracking-tight">
        Approach
      </h4>
      <p className="leading-relaxed text-muted">
        I modeled this tweet on how Ramp Labs publishes research: a short
        first-person post above the card, then the paper rewritten as a native
        Article rather than a link to a Google Doc. Ramp&apos;s
        highest-performing research posts (385K and 413K views) use exactly this
        format. An Article is one object, so it gets quote-tweeted as one thing;
        X ranks it as native content instead of an external link; and the charts
        render inline where people are already reading. It also lets Rox say the
        technical stuff, the effort-vs-accuracy finding, the SPARQL-to-SQL
        rewriting, the failure modes, without the company account having to.
        Coming from the CTO, it reads as an engineer explaining a design
        decision, which is who the AI-infra and knowledge-graph audience will
        actually engage with.
      </p>

      {ADDITIONAL.length > 0 && (
        <div className="mt-5 flex flex-col gap-4">
          {ADDITIONAL.map((draft, i) => (
            <DraftTweet draft={draft} key={i} />
          ))}
        </div>
      )}

      <hr className="rox-rule" />

      <H2 n="03">Distribution</H2>

      <h3 className="mt-6 mb-1 text-[0.95rem] font-semibold tracking-tight">
        Timeline
      </h3>
      <ol className="rox-timeline blur-group">
        {TIMELINE.map((entry, i) => (
          <li className="rox-timeline-item blur-item" key={i}>
            <span className="rox-timeline-rail" aria-hidden>
              <span className="rox-timeline-dot" />
              <span className="rox-timeline-line" />
            </span>
            <div>
              <div className="rox-timeline-day">{entry.day}</div>
              <div className="rox-timeline-title">{entry.title}</div>
              <p className="rox-timeline-body">{entry.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <h3 className="mt-8 mb-2 text-[0.95rem] font-semibold tracking-tight">
        Before launch
      </h3>
      <ul className="flex flex-col gap-2.5 pl-5 list-disc leading-relaxed text-muted">
        <li>
          Have the paper&apos;s authors and Rox engineers draft their own
          one-line posts, ready for the first 24 hours. These don&apos;t need to
          be meticulously drafted, just organic personal thoughts.
        </li>
        <li>
          Reach out to Snowflake&apos;s devrel/partner team; the whole
          experiment ran on their warehouse so a partner tweet could be in play.
        </li>
        <li>
          Reach out to Juan Sequeda (co-author of the 2023 benchmark this paper
          extends). Rox confirms his result at agent scale with a wider gap and
          he&apos;s one of the most followed voices in knowledge-graph Twitter.
          If we can get him to QT a paper that vindicates his, our
          domain-specific reach will go way up.
        </li>
        <li>
          If the case study is related to a specific customer company like Ramp
          or MongoDB, would reach out to their team to see if we can co-create
          some content.
        </li>
        <li>
          Would also reach out to the Sequoia or General Catalyst content teams
          to see if they&apos;d amplify portfolio research.
        </li>
      </ul>

      <h3 className="mt-7 mb-2 text-[0.95rem] font-semibold tracking-tight">
        How I&apos;d measure it
      </h3>
      <ul className="flex flex-col gap-2.5 pl-5 list-disc leading-relaxed text-muted">
        <li>
          Anchor views are the headline, but track QT ratio (people restating
          it), saves (intent to read), replies from named KG and RevOps
          accounts, and paper clicks.
        </li>
        <li>
          100K is realistic across anchor + Ishan QT + Shriram&apos;s Article.
          I&apos;d also want to track organic views on partner QTs/posts and
          organic QTs.
        </li>
      </ul>
    </div>
  );
}
