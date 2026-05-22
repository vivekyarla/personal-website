import Link from "next/link";

type Props = {
  title: string;
  href: string;
  description: string;
};

const isDev = process.env.NODE_ENV === "development";

export default function HoverReveal({ title, href, description }: Props) {
  return (
    <div className="text-center">
      <Link
        href={href}
        className={`inline-flex items-baseline gap-1.5 tracking-tight hover:opacity-70 transition-opacity ${
          isDev ? "font-serif font-normal text-lg" : "font-semibold text-base"
        }`}
      >
        <span>{title}</span>
        <span className="text-muted text-xs">→</span>
      </Link>
      <p className="pt-2 text-[0.85rem] leading-relaxed text-muted">
        {description}
      </p>
    </div>
  );
}
