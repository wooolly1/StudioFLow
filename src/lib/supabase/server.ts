import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/supabase/types";
import { env } from "@/lib/env";

/**
 * Server Component / Server Action / Route Handler Supabase client.
 * Uses the authenticated user's session via cookies.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const e = env();

  return createServerClient<Database>(
    e.NEXT_PUBLIC_SUPABASE_URL,
    e.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options: CookieOptions;
          }[]
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — `set` is a no-op there.
            // Middleware will refresh the session for subsequent requests.
          }
        },
      },
    }
  );
}
