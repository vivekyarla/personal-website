import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

// Public, RLS-respecting client. Safe in client components.
export const supabasePublic = createClient(url, publishableKey, {
  auth: { persistSession: false },
});
