import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PROTECTED_PARENT = ["/parent", "/onboarding", "/dashboard", "/quiz"];
const PROTECTED_ADMIN = ["/admin"];
const PROTECTED_TUTOR = ["/tutor"];
const PROTECTED_CHILD = ["/child"];
const PUBLIC_AUTH = ["/auth/login", "/auth/admin", "/auth/signup", "/auth/verify-email", "/auth/forgot-password", "/auth/reset-password", "/auth/logout"];

function isPrefixed(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

// Pass the current pathname to server components via a request header, so the
// root layout can drop its global chrome on full-bleed routes. Used for every
// non-redirect response below.
function passthrough(req: NextRequest): NextResponse {
  const headers = new Headers(req.headers);
  headers.set("x-pathname", req.nextUrl.pathname);
  return NextResponse.next({ request: { headers } });
}

export async function middleware(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl;

  // Always let NextAuth's own routes, public auth pages, and static assets through.
  if (
    pathname.startsWith("/api/auth") ||
    isPrefixed(pathname, PUBLIC_AUTH)
  ) {
    return passthrough(req);
  }

  // Profile lock: while a PIN-locked child session is active (cookie set when a
  // parent with a PIN picks a child), block the parent app and profile-switching
  // — even by typing the URL — until the PIN is entered at /child/unlock.
  if (req.cookies.get("child-lock")?.value === "1") {
    const locked =
      pathname === "/parent" ||
      pathname.startsWith("/parent/") ||
      pathname === "/child/select" ||
      pathname.startsWith("/child/select/");
    if (locked) {
      const url = req.nextUrl.clone();
      url.pathname = "/child/unlock";
      url.search = `?next=${encodeURIComponent(pathname)}`;
      return NextResponse.redirect(url);
    }
  }

  const needsParent = isPrefixed(pathname, PROTECTED_PARENT);
  const needsAdmin = isPrefixed(pathname, PROTECTED_ADMIN);
  const needsTutor = isPrefixed(pathname, PROTECTED_TUTOR);
  const needsChild = isPrefixed(pathname, PROTECTED_CHILD);
  if (!needsParent && !needsAdmin && !needsTutor && !needsChild) return passthrough(req);

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  const role = (token.role as string | undefined) ?? "parent";
  const isAdmin = role === "superadmin" || role === "orgadmin";
  const impersonating = Boolean(req.cookies.get("admin-impersonate"));
  const home = roleHome(role);

  // /admin/* → admins only
  if (needsAdmin && !isAdmin) {
    return redirectTo(req, home);
  }

  // /tutor/* → tutors (or an admin, for oversight)
  if (needsTutor && role !== "tutor" && !isAdmin) {
    return redirectTo(req, home);
  }

  // /parent/* → parents. Admins are bounced to their dashboard unless
  // impersonating — EXCEPT for /parent/child/* which is the canonical
  // student-detail view (the admin "View" button on /admin/students links
  // here). requireParentSession already lets superadmin through with the
  // ownership check bypassed.
  if (needsParent && isAdmin && !impersonating) {
    const isStudentDetail = pathname.startsWith("/parent/child/");
    if (!isStudentDetail) return redirectTo(req, "/admin/dashboard");
  }
  if (needsParent && (role === "tutor" || role === "student")) {
    return redirectTo(req, home);
  }

  // /child/* → a logged-in student (own profile) OR a parent who picked a
  // child OR an impersonating admin. Tutors/plain admins can't enter.
  if (needsChild) {
    if (role === "student" || role === "parent") {
      // allowed
    } else if (isAdmin && impersonating) {
      // allowed (admin impersonating a parent)
    } else {
      return redirectTo(req, home);
    }
  }

  return passthrough(req);
}

function roleHome(role: string): string {
  switch (role) {
    case "superadmin":
    case "orgadmin":
      return "/admin/dashboard";
    case "tutor":
      return "/tutor/dashboard";
    case "student":
      return "/child/home";
    default:
      return "/parent/dashboard";
  }
}

function redirectTo(req: NextRequest, pathname: string): NextResponse {
  const url = req.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  return NextResponse.redirect(url);
}

// Run middleware on everything except _next, favicon, and explicit asset paths.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
