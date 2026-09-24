import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Routes that must stay reachable even while the site is shut down for
// maintenance — the admin still needs a way to sign in and land on the
// maintenance page itself can't rewrite to itself (infinite loop).
const MAINTENANCE_ALLOWLIST = ["/maintenance", "/sign-in", "/auth/callback", "/auth/reset-password", "/manifest.webmanifest"];

function isAllowlisted(pathname: string): boolean {
  return MAINTENANCE_ALLOWLIST.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

// Refreshes the Supabase auth session cookie on every request so server
// components/actions always see an up-to-date session, and — while
// Admin -> Maintenance has the site shut down — gates every page behind
// the admin's own account. This is the actual enforcement: the "Shut down
// site" toggle isn't just hiding the real pages in the UI, it's checked
// here before any of them render, so a signed-out visitor or a regular
// user gets the maintenance page no matter what URL they try.
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  if (!isAllowlisted(pathname)) {
    const { data: settings } = await supabase
      .from("settings")
      .select("maintenance_mode")
      .eq("id", 1)
      .maybeSingle();

    if (settings?.maintenance_mode) {
      let isAdmin = false;
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", user.id)
          .maybeSingle();
        isAdmin = Boolean(profile?.is_admin);
      }
      if (!isAdmin) {
        const url = request.nextUrl.clone();
        url.pathname = "/maintenance";
        const rewritten = NextResponse.rewrite(url);
        // Carry over any refreshed auth cookies from the Supabase client
        // above — returning a fresh NextResponse here instead of `response`
        // would otherwise silently drop a session token refresh.
        response.cookies.getAll().forEach((cookie) => rewritten.cookies.set(cookie));
        return rewritten;
      }
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
