import { supabasePublic } from "@/lib/supabase";

export type InboundReading = {
  id: string;
  title: string;
  url: string | null; // optional for books
  source: string | null; // author, for books
  tag: string | null;
  date_published: string; // ISO yyyy-mm-dd (books: date finished)
  summary: string;
  quotes: string[];
  pinned: boolean;
  kind: "article" | "book";
  created_at: string;
};

export async function fetchInbound(): Promise<InboundReading[]> {
  const { data, error } = await supabasePublic
    .from("inbound_readings")
    .select("*")
    .order("pinned", { ascending: false })
    .order("date_published", { ascending: false });

  if (error) {
    console.error("[inbound] fetch error:", error.message);
    return [];
  }
  return (data ?? []) as InboundReading[];
}

export function formatInboundDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
