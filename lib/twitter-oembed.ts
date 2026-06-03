import "server-only";

export type OEmbedResult = {
  html: string;
  author_name?: string;
  author_url?: string;
};

export async function fetchTweetEmbed(url: string): Promise<OEmbedResult | null> {
  const endpoint = new URL("https://publish.twitter.com/oembed");
  endpoint.searchParams.set("url", url);
  endpoint.searchParams.set("omit_script", "1");
  endpoint.searchParams.set("dnt", "true");

  try {
    const res = await fetch(endpoint.toString(), {
      headers: { "User-Agent": "vivekyarla.com" },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as OEmbedResult;
    return data;
  } catch (err) {
    console.error("[twitter-oembed]", err);
    return null;
  }
}
