import type { MetadataRoute } from "next";
import { fetchPosts } from "@/lib/substack";

const BASE = "https://vivekyarla.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let posts: Awaited<ReturnType<typeof fetchPosts>> = [];
  try {
    posts = await fetchPosts();
  } catch {}

  return [
    { url: BASE, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/writing`, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/repository`, changeFrequency: "daily", priority: 0.8 },
    ...posts.map((p) => ({
      url: `${BASE}/writing/${p.slug}`,
      lastModified: p.pubDateISO ? new Date(p.pubDateISO) : undefined,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
