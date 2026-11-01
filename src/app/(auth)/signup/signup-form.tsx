"use client";

import { useActionState } from "react";
import { signup, type AuthFormState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AuthFormState = {};

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signup, initialState);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="displayName">Your name</Label>
        <Input
          id="displayName"
          name="displayName"
          type="text"
          autoComplete="name"
          required
          minLength={2}
          placeholder="Jamie Doe"
        />
        {state.fieldErrors?.displayName && (
          <p className="text-xs text-destructive">
            {state.fieldErrors.displayName}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@studio.com"
        />
        {state.fieldErrors?.email && (
          <p className="text-xs text-destructive">{state.fieldErrors.email}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
        />
        {state.fieldErrors?.password && (
          <p className="text-xs text-destructive">
            {state.fieldErrors.password}
          </p>
        )}
      </div>

      {state.error && (
        <p className="rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-foreground">
          {state.error}
        </p>
      )}

      <Button type="submit" className="w-full" loading={pending}>
        Create account
      </Button>
    </form>
  );
}
