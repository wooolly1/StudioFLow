import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
        <Link href="/">
          <Logo className="text-primary-foreground" />
        </Link>
        <div className="space-y-4">
          <blockquote className="font-display text-2xl leading-snug text-balance">
            “StudioFlow turned our agency from juggling five dashboards into
            running every client website from one room.”
          </blockquote>
          <p className="text-sm text-primary-foreground/70">
            — Operations lead, boutique web studio
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md animate-fade-in">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
