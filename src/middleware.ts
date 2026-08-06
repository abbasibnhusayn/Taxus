import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Edge-runtime middleware — deliberately does NOT import from lib/auth/jwt.ts
// (which is fine to share) but keeps its own minimal verify call inline to
// avoid pulling in any Node-only dependencies into the Edge bundle.
const SESSION_COOKIE_NAME = "taxus_session";

async function isValidSession(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const secret = process.env.SESSION_SECRET;
  if (!secret) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isAuthRoute = path.startsWith("/login") || path.startsWith("/signup");
  const isProtectedRoute = path.startsWith("/app") || path.startsWith("/portal");

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const authenticated = await isValidSession(token);

  if (!authenticated && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  if (authenticated && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/app/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
