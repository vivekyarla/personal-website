import "server-only";

// Finds cover images (and page counts) for a book by title + author, so
// covers never have to be uploaded. Open Library first (free, no key);
// Google Books as a fallback. Returns up to 6 candidates, best first.
export type CoverCandidate = {
  cover_url: string;
  pages: number | null;
  title: string;
  author: string | null;
  year: number | null;
};

const TIMEOUT_MS = 6000;

async function getJson(url: string) {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { "User-Agent": "vivekyarla.com (book covers)" },
    next: { revalidate: 60 * 60 * 24 },
  });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

// Study guides / summaries / box sets match many titles but aren't the book.
const NOT_THE_BOOK =
  /sparknotes|cliffsnotes|study guide|summary of|summary &|analysis of|box(ed)? set|collection set/i;
// Same work, different book: adaptations and abridgements.
const SPINOFF = /graphic (novel|history)|young (adult|readers)|abridged|workbook|illustrated edition|volume (two|three|2|3)/i;

// "Thinking, Fast and Slow" → "thinking fast and slow"
const norm = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();

// Open Library: the best-matching work's English editions with covers,
// then the work's own cover, then other matching works' covers.
async function openLibrary(title: string, author: string): Promise<CoverCandidate[]> {
  const q = new URLSearchParams({
    title,
    lang: "en",
    limit: "8",
    fields: "key,title,author_name,cover_i,number_of_pages_median,first_publish_year",
  });
  if (author) q.set("author", author);
  const data = await getJson(`https://openlibrary.org/search.json?${q}`);
  type Doc = {
    key?: string;
    title?: string;
    author_name?: string[];
    cover_i?: number;
    number_of_pages_median?: number;
    first_publish_year?: number;
  };
  const docs = ((data.docs ?? []) as Doc[]).filter((d) => !NOT_THE_BOOK.test(d.title ?? ""));
  const cover = (id: number) => `https://covers.openlibrary.org/b/id/${id}-L.jpg`;
  const out: CoverCandidate[] = [];
  const seen = new Set<number>();
  const push = (id: number | undefined, d: Doc) => {
    if (!id || id < 0 || seen.has(id)) return;
    seen.add(id);
    out.push({
      cover_url: cover(id),
      pages: d.number_of_pages_median ?? null,
      title: d.title ?? title,
      author: d.author_name?.[0] ?? null,
      year: d.first_publish_year ?? null,
    });
  };

  const top = docs[0];
  if (!top) return out;

  // Rank the top work's editions: English editions whose own title matches
  // what was typed come first (catalog language tags are unreliable —
  // "Der grosse Gatsby" is tagged English — and spin-offs like "Sapiens:
  // A Graphic History" share the work). Then the work's own cover (Open
  // Library's pick, any language), then the rest. Page count stays the
  // work's median across editions so cycling covers doesn't swing it.
  const want = norm(title);
  const ranked: { id: number; rank: number }[] = [];
  if (top.key) {
    try {
      type Edition = { title?: string; covers?: number[]; languages?: { key: string }[] };
      const eds = await getJson(`https://openlibrary.org${top.key}/editions.json?limit=80`);
      for (const e of (eds.entries ?? []) as Edition[]) {
        const id = e.covers?.find((c) => c > 0);
        if (!id) continue;
        const english = e.languages?.some((l) => l.key.endsWith("/eng"));
        const unlabeled = !e.languages?.length;
        const t = norm(e.title ?? "");
        const titleMatch = t === want || t.startsWith(want + " ");
        const spinoff = SPINOFF.test(e.title ?? "");
        const rank =
          spinoff ? 9
          : english && titleMatch ? 0
          : unlabeled && titleMatch ? 2
          : english ? 3
          : 4;
        ranked.push({ id, rank });
      }
    } catch (err) {
      console.error("[books] open library editions:", err);
    }
  }
  ranked.sort((x, y) => x.rank - y.rank);
  for (const r of ranked.filter((r) => r.rank < 2)) push(r.id, top);
  push(top.cover_i, top);
  for (const r of ranked.filter((r) => r.rank >= 2)) push(r.id, top);
  // Then other matching works' covers.
  for (const d of docs.slice(1)) push(d.cover_i, d);
  return out;
}

async function googleBooks(title: string, author: string): Promise<CoverCandidate[]> {
  const q = `intitle:${title}${author ? `+inauthor:${author}` : ""}`;
  const data = await getJson(
    `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=10`
  );
  type Item = {
    volumeInfo?: {
      title?: string;
      authors?: string[];
      pageCount?: number;
      publishedDate?: string;
      imageLinks?: { thumbnail?: string };
    };
  };
  return ((data.items ?? []) as Item[])
    .map((i) => i.volumeInfo ?? {})
    .filter((v) => v.imageLinks?.thumbnail && !NOT_THE_BOOK.test(v.title ?? ""))
    .map((v) => ({
      // https + larger zoom; strip the curled-page edge effect
      cover_url: v
        .imageLinks!.thumbnail!.replace(/^http:/, "https:")
        .replace("&edge=curl", "")
        .replace("zoom=1", "zoom=2"),
      pages: v.pageCount ?? null,
      title: v.title ?? title,
      author: v.authors?.[0] ?? null,
      year: v.publishedDate ? Number(v.publishedDate.slice(0, 4)) || null : null,
    }));
}

export async function lookupCovers(title: string, author: string): Promise<CoverCandidate[]> {
  const t = title.trim(), a = author.trim();
  if (!t) return [];
  let out: CoverCandidate[] = [];
  try {
    out = await openLibrary(t, a);
  } catch (err) {
    console.error("[books] open library:", err);
  }
  if (out.length === 0) {
    try {
      out = await googleBooks(t, a);
    } catch (err) {
      console.error("[books] google books:", err);
    }
  }
  return out.slice(0, 6);
}
