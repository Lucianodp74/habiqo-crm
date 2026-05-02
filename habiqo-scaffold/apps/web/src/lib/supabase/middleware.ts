import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value === "REPLACE_ME" || value === "demo-key" || value.includes("demo.supabase.co")) {
    throw new Error(
      `Supabase env misconfigured: ${name}. Set apps/web/.env.local with real values (NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY).`,
    );
  }
  return value;
}

/**
 * Middleware-side Supabase client. Refreshes the session cookie on
 * every request. Without this, expired sessions will silently break
 * RSC reads.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: Array<{ name: string; value: string; options?: Parameters<typeof response.cookies.set>[2] }>,
        ) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // CRITICAL: this call refreshes the session if expired.
  // Removing it will break auth in subtle ways.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user };
}
