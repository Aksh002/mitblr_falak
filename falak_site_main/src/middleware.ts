import { withAuth } from "next-auth/middleware";
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { JWT } from "next-auth/jwt";

type AugToken = JWT & { needsOnboarding?: boolean };

export async function middleware(req: NextRequest) {
  if (
    req.nextUrl.pathname.startsWith("/api") ||
    req.nextUrl.pathname.startsWith("/api/auth") ||
    req.nextUrl.pathname.startsWith("/_next") ||
    req.nextUrl.pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }
  const token =  (await getToken({ req })) as AugToken | null;
  const needs = token?.needsOnboarding === true;
  const isOnboarding = req.nextUrl.pathname.startsWith("/onboarding");
  const isAdminPage = req.nextUrl.pathname.startsWith("/admin_manage");

  // Force karta hai user to onboarding only if bkl is logged in & not registered
  if (token && needs && !isOnboarding && !isAdminPage) {
    const url = new URL("/onboarding", req.url);
    return NextResponse.redirect(url);
  }
  // Force karta hai user to home if bkl is logged in & still onboarding khol lia hai 
  if (token && !needs && isOnboarding && !isAdminPage) {
    const url = new URL("/", req.url);
    return NextResponse.redirect(url);
  }

  // NOTE: Do not hard-redirect here for admin; let the page/SSR guard handle auth/role to avoid flaky redirects

  if (req.nextUrl.pathname.startsWith("/api")) {
    return NextResponse.next();
  }
    
  return NextResponse.next();
}
export default withAuth(middleware, {
  callbacks: {
      authorized: () => {
        // Allow the request; we handle onboarding and admin gating in our custom middleware/page logic
        return true;
      },
  },
});

export const config = {
  matcher: [
    "/onboarding",
    "/admin_manage",
    "/profile",
    "/((?!api|_next|favicon.ico|api/auth).*)", // general matcher
  ],
};

