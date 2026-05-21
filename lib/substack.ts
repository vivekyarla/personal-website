import { XMLParser } from "fast-xml-parser";

export type SubstackPost = {
  title: string;
  slug: string;
  url: string;
  pubDate: string;
  pubDateISO: string;
  description: string;
  contentHtml: string;
  creator?: string;
};

const SUBSTACK_HANDLE = "vyarla";
const FEED_URL = `https://${SUBSTACK_HANDLE}.substack.com/feed`;

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  cdataPropName: "__cdata",
  processEntities: true,
  htmlEntities: true,
});

function unwrap(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null) {
    const v = value as Record<string, unknown>;
    if (typeof v.__cdata === "string") return v.__cdata;
    if (typeof v["#text"] === "string") return v["#text"] as string;
  }
  return String(value);
}

function slugFromLink(link: string): string {
  try {
    const u = new URL(link);
    const parts = u.pathname.split("/").filter(Boolean);
    return parts[parts.length - 1] ?? link;
  } catch {
    return link;
  }
}

export async function fetchPosts(): Promise<SubstackPost[]> {
  const res = await fetch(FEED_URL, {
    next: { revalidate: 600 },
    headers: { "User-Agent": "vivekyarla.com" },
  });
  if (!res.ok) {
    console.error("Substack feed fetch failed", res.status);
    return [];
  }
  const xml = await res.text();
  const parsed = parser.parse(xml);
  const channel = parsed?.rss?.channel;
  if (!channel) return [];

  const itemsRaw = channel.item;
  const items = Array.isArray(itemsRaw) ? itemsRaw : itemsRaw ? [itemsRaw] : [];

  return items.map((item: Record<string, unknown>): SubstackPost => {
    const link = unwrap(item.link);
    const title = unwrap(item.title);
    const description = unwrap(item.description);
    const contentHtml = unwrap(
      (item["content:encoded"] as unknown) ?? item.content ?? description
    );
    const pubDate = unwrap(item.pubDate);
    const pubDateISO = pubDate ? new Date(pubDate).toISOString() : "";
    const creator = unwrap((item["dc:creator"] as unknown) ?? "");
    return {
      title,
      url: link,
      slug: slugFromLink(link),
      pubDate,
      pubDateISO,
      description,
      contentHtml,
      creator,
    };
  });
}

export async function fetchPost(slug: string): Promise<SubstackPost | null> {
  const posts = await fetchPosts();
  return posts.find((p) => p.slug === slug) ?? null;
}

export function formatDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function excerpt(text: string, max = 180): string {
  const plain = text
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (plain.length <= max) return plain;
  return plain.slice(0, max).replace(/\s+\S*$/, "") + "…";
}
