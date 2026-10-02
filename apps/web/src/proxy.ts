import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PAGES = ["/", "/login", "/signup"];

// Optimistic gate only: the real session check happens in the API routes
// (currentUser) and the (app) layout.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has("evermind_session");

  if (pathname.startsWith("/api/")) {
    if (pathname.startsWith("/api/auth/") || hasSession) return NextResponse.next();
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }

  const isPublic = PUBLIC_PAGES.includes(pathname);

  if (!hasSession && !isPublic) {
    const login = new URL("/login", request.url);
    return NextResponse.redirect(login);
  }
  if (hasSession && isPublic) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
