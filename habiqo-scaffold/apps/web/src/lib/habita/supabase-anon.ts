/**
 * Habita · Supabase client for anonymous public reads.
 *
 * Used exclusively by the public Habita pages at /[agencySlug].
 * Uses only the public anon key — no service role, no user cookies.
 * RLS policies on the database scope reads to `is_public = true` rows.
 *
 * Module-level caching avoids re-creating the client on every request
 * inside a warm serverless instance. The client is stateless.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type AnonClient = SupabaseClient;

let cachedClient: AnonClient | null = null;

export function getAnonClient(): AnonClient {
  if (cachedClient) return cachedClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "[habita] NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing."
    );
  }

  cachedClient = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return cachedClient;
}
