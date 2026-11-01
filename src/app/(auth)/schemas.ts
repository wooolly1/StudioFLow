import { z } from "zod";

/**
 * Validators shared by server actions and tests.
 * Kept in a separate module so tests can import without pulling "use server".
 */

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export const signupSchema = loginSchema.extend({
  displayName: z.string().min(2, "Name must be at least 2 characters."),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;

export function fieldErrorsFromZod(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !out[key]) out[key] = issue.message;
  }
  return out;
}

/**
 * Returns a redirect target that is strictly an internal, same-origin path.
 * Rejects protocol-relative (`//evil`) and absolute URLs to prevent open-redirect.
 */
export function safeInternalPath(input: unknown, fallback = "/dashboard"): string {
  if (typeof input !== "string" || input.length === 0) return fallback;
  if (!input.startsWith("/")) return fallback;
  if (input.startsWith("//")) return fallback;
  if (input.startsWith("/\\")) return fallback;
  return input;
}
