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
    org: "Rox",
    role: "Special Projects",
    year: "Fall 2026",
    href: "https://rox.com",
  },
  {
    org: "McKinsey & Company",
    role: "Summer Analyst",
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

const personLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Vivek Yarlagedda",
  url: "https://vivekyarla.com",
  sameAs: [
    "https://x.com/vivekyarla",
    "https://linkedin.com/in/vivekyarla",
    "https://vyarla.substack.com",
  ],
  affiliation: {
    "@type": "CollegeOrUniversity",
    name: "Stanford University",
  },
};

export default function Home() {
  return (
    <div className="namespot waterfall w-full max-w-[600px] mx-auto flex flex-1 flex-col gap-[clamp(0.875rem,2.4vh,2rem)] text-[0.9rem] pt-[clamp(1.5rem,7vh,6rem)] pb-6">
      <HomeViewport />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personLd) }}
      />
      {/* Name + live clock */}
      <header className="flex items-center justify-between gap-3">
        <NameToggle />
        <Clock />
      </header>

      {/* Bio */}
      <section className="name-dim">
        <p className="leading-relaxed">
          I&apos;m 19 and a student at Stanford studying Economics &amp;
          Computer Science. Currently, I&apos;m learning about non-traditional
          markets, globalization, and morality. I&apos;m also an intern at{" "}
          <a
            href="https://rox.com"
            target="_blank"
            rel="noreferrer"
            className="hl-link"
          >
            Rox
          </a>
          , a Sequoia-backed AI unicorn, working across product, research, and
          GTM. Previously, I worked on AI rollouts at{" "}
          <a
            href="https://www.mckinsey.com/"
            target="_blank"
            rel="noreferrer"
            className="hl-link"
          >
            McKinsey
          </a>{" "}
          and diligence at several venture firms.
        </p>
      </section>

      {/* Interests */}
      <section className="name-dim">
        <p className="leading-relaxed">
          The world we live in is changing rapidly. I believe that how things
          are done today, even at the frontier, will rapidly become archaic.
          Through understanding technology, markets, culture, and society, I
          want to figure out what to spend my twenties on.
        </p>
      </section>


      {/* Writing / Repository */}
      <section className="name-dim blur-group grid grid-cols-2 gap-8 sm:gap-12">
        <div className="blur-item">
          <HoverReveal
            title="Writing"
            href="/writing"
            description="Pieces I've read that materially changed my worldview."
          />
        </div>
        <div className="blur-item">
          <HoverReveal
            title="Repository"
            href="/repository"
            description={
              <>
                Tweets that capture what I&apos;m curious
                <br />
                about at the moment.
              </>
            }
          />
        </div>
      </section>

      {/* Projects */}
      <section className="name-dim">
        <h2
          className={`tracking-tight mb-1.5 ${
            process.env.NODE_ENV === "development" ? "font-serif font-normal text-lg" : "text-base font-semibold"
          }`}
        >
          Projects
        </h2>
        <hr className="border-rule mb-1" />
        <ul className="blur-group">
          <li className="blur-item py-1.5 flex items-baseline justify-between gap-4">
            <div className="leading-tight min-w-0">
              <div className="font-medium">
                Situational Unawareness{" "}
                <span className="font-normal text-muted text-[0.8rem] whitespace-nowrap">
                  (
                  <a
                    href="https://situational-unawareness.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="underline decoration-rule underline-offset-4 hover:decoration-foreground"
                  >
                    map
                  </a>
                  ){" "}(
                  <a
                    href="https://situational-unawareness.com/manifesto"
                    target="_blank"
                    rel="noreferrer"
                    className="underline decoration-rule underline-offset-4 hover:decoration-foreground"
                  >
                    manifesto
                  </a>
                  )
                </span>
              </div>
              <div className="italic text-muted text-[0.85rem] mt-1">
                Live deal map to track the full-stack AI economy
              </div>
            </div>
            <span className="text-muted text-[0.8rem] whitespace-nowrap tabular-nums">
              Spring 2026
            </span>
          </li>
          <li className="blur-item py-1.5 flex items-baseline justify-between gap-4">
            <div className="leading-tight min-w-0">
              <div className="font-medium">
                A Novel Matching Mechanism for Idle Compute{" "}
                <span className="font-normal text-muted text-[0.8rem] whitespace-nowrap">
                  (
                  <a
                    href="https://drive.google.com/file/d/1ecOMU-rpeg3LDmxG0m3VIG3cAS9pY7PF/view?usp=sharing"
                    target="_blank"
                    rel="noreferrer"
                    className="underline decoration-rule underline-offset-4 hover:decoration-foreground"
                  >
                    paper
                  </a>
                  ){" "}(
                  <a
                    href="https://drive.google.com/file/d/1LyRbqVtve0DBpFlcESQpZ6l9c0N3Zy3p/view?usp=drive_link"
                    target="_blank"
                    rel="noreferrer"
                    className="underline decoration-rule underline-offset-4 hover:decoration-foreground"
                  >
                    deck
                  </a>
                  )
                </span>
              </div>
              <div className="italic text-muted text-[0.85rem] mt-1">
                Ascending clock auction proposal to solve GPU market failures
              </div>
            </div>
            <span className="text-muted text-[0.8rem] whitespace-nowrap tabular-nums">
              Spring 2026
            </span>
          </li>
        </ul>
      </section>

      {/* Experience */}
      <section className="name-dim">
        <h2
          className={`tracking-tight mb-1.5 ${
            process.env.NODE_ENV === "development" ? "font-serif font-normal text-lg" : "text-base font-semibold"
          }`}
        >
          Experience
        </h2>
        <hr className="border-rule mb-1" />
        <ul className="blur-group">
          {experience.map((item) => (
            <li
              key={`${item.org}-${item.year}`}
              className="blur-item py-1.5 flex items-baseline justify-between gap-4"
            >
              <div className="leading-tight min-w-0">
                <div className="font-medium">
                  {item.href ? (
                    <a href={item.href} target="_blank" rel="noreferrer">
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
              X
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
