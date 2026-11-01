import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/supabase/types";
import { env } from "@/lib/env";

const PUBLIC_PATHS = ["/", "/login", "/signup", "/forgot-password", "/auth"];
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/websites",
  "/clients",
  "/media",
  "/settings",
  "/portal",
];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const e = env();
  const supabase = createServerClient<Database>(
    e.NEXT_PUBLIC_SUPABASE_URL,
    e.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options: CookieOptions;
          }[]
        ) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Do not run code between createServerClient and getUser().
  // getUser revalidates the session via Supabase Auth.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const needsAuth = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));

  if (!user && needsAuth) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (
    user &&
    (pathname === "/login" || pathname === "/signup" || pathname === "/")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Reserved so lint doesn't flag it
  void PUBLIC_PATHS;

  return response;
}
