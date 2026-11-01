"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { publicEnv } from "@/lib/env";
import {
  loginSchema,
  signupSchema,
  fieldErrorsFromZod,
  safeInternalPath,
} from "./schemas";

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

  const safeNext = safeInternalPath(formData.get("next"));
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
  return { error: "Check your inbox to confirm your email, then sign in." };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
