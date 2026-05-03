import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (
    !value ||
    value === "REPLACE_ME" ||
    value === "demo-key" ||
    value.includes("demo.supabase.co")
  ) {
    throw new Error(
      `Supabase env misconfigured: ${name}. Set apps/web/.env.local with real values (NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY).`,
    );
  }
  return value;
}

/**
 * Supabase client for Server Components, Server Actions, and Route Handlers.
 * Reads cookies via Next.js `cookies()`. The setAll callback is best-effort
 * because cookies cannot be set from a Server Component — middleware refreshes
 * them on every request.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: Array<{
            name: string;
            value: string;
            options?: Parameters<typeof cookieStore.set>[2];
          }>,
        ) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component (cookies are read-only there).
            // Middleware refreshes the session, so this is non-fatal.
          }
        },
      },
    },
  );
}
