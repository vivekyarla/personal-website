import "server-only";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const secretKey = process.env.SUPABASE_SECRET_KEY!;

// Admin client (bypasses RLS). Server-only — `server-only` enforces this at
// build time; any client import will fail loudly.
export const supabaseAdmin = createClient(url, secretKey, {
  auth: { persistSession: false },
});
