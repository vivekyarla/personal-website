// Dumps the public-content Supabase tables to backups/*.json.
// Private tables (habits, habit_entries, briefs, daily_sentences,
// admin_credentials) are deliberately excluded — this repo is public.
// Env: SUPABASE_URL, SUPABASE_SECRET_KEY.
import { mkdir, writeFile } from "node:fs/promises";

const URL_BASE = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SECRET_KEY;
if (!URL_BASE || !KEY) {
  console.error("Missing SUPABASE_URL / SUPABASE_SECRET_KEY");
  process.exit(1);
}

const TABLES = ["tweets", "tweet_categories", "inbound_readings"];

await mkdir("backups", { recursive: true });

for (const table of TABLES) {
  const res = await fetch(
    `${URL_BASE}/rest/v1/${table}?select=*&order=created_at.asc`,
    {
      headers: {
        apikey: KEY,
        Authorization: `Bearer ${KEY}`,
        Range: "0-99999",
      },
    }
  );
  if (!res.ok) {
    console.error(`${table}: HTTP ${res.status}`);
    process.exit(1);
  }
  const rows = await res.json();
  await writeFile(
    `backups/${table}.json`,
    JSON.stringify(rows, null, 2) + "\n"
  );
  console.log(`${table}: ${rows.length} rows`);
}
