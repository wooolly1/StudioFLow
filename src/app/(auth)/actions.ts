"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { publicEnv } from "@/lib/env";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

const signupSchema = loginSchema.extend({
  displayName: z.string().min(2, "Name must be at least 2 characters."),
});

export type AuthFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function login(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { error: error.message };
  }

  // User-supplied redirect target: validated to be an internal path.
  const rawNext = (formData.get("next") as string | null) || "/dashboard";
  const safeNext: string =
    rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/dashboard";
  revalidatePath("/", "layout");
  // typedRoutes narrows redirect() to known routes; this value is dynamic.
  redirect(safeNext as never);
}

export async function signup(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = signupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    displayName: formData.get("displayName"),
  });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${publicEnv.appUrl}/auth/callback`,
      data: { display_name: parsed.data.displayName },
    },
  });
  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  // If email confirmation is required (Supabase default), tell the user.
  // We return a success "error" message that the UI treats as info.
  return { error: "Check your inbox to confirm your email, then sign in." };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

function fieldErrorsFromZod(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !out[key]) out[key] = issue.message;
  }
  return out;
}
