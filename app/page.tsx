import Clock from "@/components/Clock";
import HomeViewport from "@/components/HomeViewport";
import HoverReveal from "@/components/HoverReveal";
import NameToggle from "@/components/NameToggle";

export const revalidate = 600;

type ExperienceItem = {
  org: string;
  role: string;
  year: string;
  href?: string;
};

const experience: ExperienceItem[] = [
  {
    org: "McKinsey & Co.",
    role: "Incoming Summer Analyst",
    year: "Summer 2026",
    href: "https://www.mckinsey.com/",
  },
  {
    org: "The Westly Group",
    role: "Diligence - Climate Tech",
    year: "Spring 2025",
    href: "https://westlygroup.com/",
  },
  {
    org: "The Chernin Group",
    role: "Diligence - Consumer AI",
    year: "Winter 2025",
    href: "https://tcg.co/",
  },
];

export default function Home() {
  return (
    <div className="waterfall flex flex-1 flex-col justify-center gap-8 text-[0.9rem] py-10">
      <HomeViewport />
      {/* Name + live clock */}
      <header className="flex items-baseline justify-between gap-3">
        <NameToggle />
        <Clock />
      </header>

      {/* Bio */}
      <section>
        <p className="leading-relaxed">
          I&apos;m 19 years old and a student at Stanford studying Economics
          &amp; Computer Science. Currently, I&apos;m learning about frontier
          markets, post-AGI governance, and predictive decision modeling. This
          summer I will be based in San Francisco, working on AI rollouts at{" "}
          <a
            href="https://www.mckinsey.com/"
            target="_blank"
            rel="noreferrer"
            className="underline decoration-rule underline-offset-4 hover:decoration-foreground"
          >
            McKinsey
          </a>
          .
        </p>
      </section>

      {/* Interests */}
      <section>
        <p className="leading-relaxed">
          The world I&apos;m growing up in is changing at an unprecedented
          pace. I believe that how things are done today, even at the
          cutting-edge, will look archaic in under a decade. Through
          understanding technology, markets, culture, and society, I want to
          figure out what to spend my twenties on.
        </p>
      </section>


      {/* Writing / Repository */}
      <section className="grid grid-cols-2 gap-8 sm:gap-12">
        <HoverReveal
          title="Writing"
          href="/writing"
          description="I sometimes write about my thoughts & predictions on: the AI build-out, high-growth startups, the venture ecosystem, economics, and life."
        />
        <HoverReveal
          title="Repository"
          href="/repository"
          description="I'm a heavy Twitter user; I believe that there's abundant alpha on the platform. Here, I collect and sort the tweets that I find most interesting."
        />
      </section>

      {/* Projects */}
      <section>
        <h2
          className={`tracking-tight mb-1.5 ${
            process.env.NODE_ENV === "development" ? "font-serif font-normal text-lg" : "text-base font-semibold"
          }`}
        >
          Projects
        </h2>
        <hr className="border-rule mb-1" />
        <ul className="divide-y divide-rule">
          <li className="py-1.5 flex items-baseline justify-between gap-4">
            <div className="leading-tight min-w-0">
              <div className="font-medium">
                <a
                  href="https://situational-unawareness.com"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:opacity-70 transition-opacity"
                >
                  Situational Unawareness
                </a>
              </div>
              <div className="italic text-muted text-[0.85rem] mt-1">
                Tracking the full-stack AI economy with a live deal map
              </div>
            </div>
            <span className="text-muted text-[0.8rem] whitespace-nowrap tabular-nums">
              Spring 2026
            </span>
          </li>
          <li className="py-1.5 flex items-baseline justify-between gap-4">
            <div className="leading-tight min-w-0">
              <div className="font-medium">
                A Novel Matching Mechanism for Idle Compute{" "}
                <span className="font-normal text-muted text-[0.8rem] whitespace-nowrap">
                  <a
                    href="https://drive.google.com/file/d/1LyRbqVtve0DBpFlcESQpZ6l9c0N3Zy3p/view?usp=drive_link"
                    target="_blank"
                    rel="noreferrer"
                    className="underline decoration-rule underline-offset-4 hover:decoration-foreground"
                  >
                    (paper)
                  </a>{" "}
                  <a
                    href="https://drive.google.com/file/d/1LyRbqVtve0DBpFlcESQpZ6l9c0N3Zy3p/view?usp=drive_link"
                    target="_blank"
                    rel="noreferrer"
                    className="underline decoration-rule underline-offset-4 hover:decoration-foreground"
                  >
                    (deck)
                  </a>
                </span>
              </div>
              <div className="italic text-muted text-[0.85rem] mt-1">
                Built an ascending clock auction to solve GPU market failures
              </div>
            </div>
            <span className="text-muted text-[0.8rem] whitespace-nowrap tabular-nums">
              Spring 2026
            </span>
          </li>
        </ul>
      </section>

      {/* Experience */}
      <section>
        <h2
          className={`tracking-tight mb-1.5 ${
            process.env.NODE_ENV === "development" ? "font-serif font-normal text-lg" : "text-base font-semibold"
          }`}
        >
          Experience
        </h2>
        <hr className="border-rule mb-1" />
        <ul className="divide-y divide-rule">
          {experience.map((item) => (
            <li
              key={`${item.org}-${item.year}`}
              className="py-1.5 flex items-baseline justify-between gap-4"
            >
              <div className="leading-tight min-w-0">
                <div className="font-medium">
                  {item.href ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:opacity-70 transition-opacity"
                    >
                      {item.org}
                    </a>
                  ) : (
                    item.org
                  )}
                </div>
                <div className="italic text-muted text-[0.85rem] mt-1">
                  {item.role}
                </div>
              </div>
              <span className="text-muted text-[0.8rem] whitespace-nowrap tabular-nums">
                {item.year}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Links */}
      <section>
        <ul className="flex flex-wrap justify-center gap-x-5 gap-y-1.5 text-[0.85rem]">
          <li>
            <a
              className="underline decoration-rule underline-offset-4 hover:decoration-foreground"
              href="https://x.com/vivekyarla"
              target="_blank"
              rel="noreferrer"
            >
              <span className="line-through decoration-foreground/60">Twitter</span> X
            </a>
          </li>
          <li>
            <a
              className="underline decoration-rule underline-offset-4 hover:decoration-foreground"
              href="https://linkedin.com/in/vivekyarla"
              target="_blank"
              rel="noreferrer"
            >
              LinkedIn
            </a>
          </li>
          <li>
            <a
              className="underline decoration-rule underline-offset-4 hover:decoration-foreground"
              href="https://vyarla.substack.com"
              target="_blank"
              rel="noreferrer"
            >
              Substack
            </a>
          </li>
          <li>
            <a
              className="underline decoration-rule underline-offset-4 hover:decoration-foreground"
              href="mailto:viveky@stanford.edu"
            >
              Email
            </a>
          </li>
        </ul>
      </section>
    </div>
  );
}
