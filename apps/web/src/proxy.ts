import { NextResponse, type NextRequest } from "next/server";

// Pages anyone can open. Sending signed-in users on to the app is done by the pages themselves
// (they check the session for real); the cookie alone can be stale, and acting on it here
// caused redirect loops after a password reset.
const PUBLIC_PAGES = ["/", "/pricing", "/login", "/signup", "/terms", "/privacy", "/forgot", "/reset"];

// Optimistic gate only: the real session check happens in the API routes
// (currentUser) and the (app) layout.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has("evermind_session");

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
