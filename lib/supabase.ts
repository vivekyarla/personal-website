import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const secretKey = process.env.SUPABASE_SECRET_KEY!;

// Public, RLS-respecting client (use for read-only public queries).
export const supabasePublic = createClient(url, publishableKey, {
  auth: { persistSession: false },
});

// Admin client (bypasses RLS). Server-only — never import from client components.
export const supabaseAdmin = createClient(url, secretKey, {
  auth: { persistSession: false },
});
