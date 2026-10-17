import { NextResponse, type NextRequest } from "next/server";

// Pages anyone can open. Sending signed-in users on to the app is done by the pages themselves
// (they check the session for real); the cookie alone can be stale, and acting on it here
// caused redirect loops after a password reset.
const PUBLIC_PAGES = ["/", "/pricing", "/login", "/signup", "/terms", "/privacy", "/forgot", "/reset"];

// The MultiSarv admin panel calls the admin API from its own site, with a bearer token instead of
// the session cookie (checked in lib/admin.ts). Only these sites get CORS headers.
const PANEL_ORIGINS = (process.env.PANEL_ORIGINS ?? "https://core.multisarv.com,http://localhost:5173")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

function panelCors(request: NextRequest): Record<string, string> | null {
  const origin = request.headers.get("origin");
  if (!origin || !PANEL_ORIGINS.includes(origin)) return null;
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Max-Age": "600",
    Vary: "Origin",
  };
}

// Optimistic gate only: the real session check happens in the API routes
// (currentUser) and the (app) layout.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has("evermind_session");

  if (pathname.startsWith("/api/admin/")) {
    const cors = panelCors(request);
    if (request.method === "OPTIONS") return new NextResponse(null, { status: cors ? 204 : 403, headers: cors ?? {} });
    if (request.headers.get("authorization")?.startsWith("Bearer ")) {
      const response = NextResponse.next();
      for (const [k, v] of Object.entries(cors ?? {})) response.headers.set(k, v);
      return response;
    }
  }

  if (pathname.startsWith("/api/")) {
    // The payment webhook and the scheduler call have no session; they are checked by a signature / secret instead.
    const open =
      pathname.startsWith("/api/auth/") ||
      pathname === "/api/health" ||
      pathname === "/api/billing/webhook" ||
      pathname === "/api/cron/learning";
    if (open || hasSession) return NextResponse.next();
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }

  const isPublic = PUBLIC_PAGES.includes(pathname);

  if (!hasSession && !isPublic) {
    const login = new URL("/login", request.url);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
