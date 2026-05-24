import { updateSession } from "@/lib/supabase/middleware";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Root middleware. Three responsibilities:
 *   1. Refresh the Supabase session on every request (required for SSR auth)
 *   2. Redirect unauthenticated users away from (app)/* routes
 *   3. Redirect authenticated users away from (auth)/* routes
 *
 * Anything that needs request-level logic (rate limiting, AB tests, geo
 * routing) plugs in here later — but middleware runs on every request,
 * so keep it lean.
 */

const APP_PREFIXES = ["/dashboard", "/crm", "/immobili", "/valutazioni", "/impostazioni"];
const AUTH_PREFIXES = ["/login", "/register", "/registrazione", "/recupero-password"];

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const isAppRoute = APP_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthRoute = AUTH_PREFIXES.some((p) => pathname.startsWith(p));

  if (isAppRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     *   - _next/static, _next/image (Next.js internals)
     *   - favicon, robots, sitemap
     *   - file extensions (image, font, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|api/webhooks|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff|woff2|ttf)$).*)",
  ],
};
