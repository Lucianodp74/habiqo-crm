import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@habiqo/database";

/**
 * Supabase client for Client Components (Realtime subscriptions,
 * client-side mutations, file uploads from browser).
 *
 * For mutations from forms, prefer Server Actions — they're more secure
 * and produce smaller client bundles.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
