"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Globe,
  Users,
  Images,
  Settings,
  UserRoundCog,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/logo";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/websites", label: "Websites", icon: Globe },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/media", label: "Media", icon: Images },
  { href: "/portal", label: "Client portal", icon: UserRoundCog },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card/60 p-4 lg:flex">
      <div className="px-2 py-3">
        <Link href="/dashboard" aria-label="StudioFlow home">
          <Logo />
        </Link>
      </div>
      <nav className="mt-6 flex-1 space-y-1">
        {nav.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="rounded-lg border border-border bg-background p-3 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">Milestone 1</p>
        <p className="mt-1 leading-relaxed">
          Foundation shipped. Visual editor, AI assistant, GitHub & Vercel
          arrive in later milestones.
        </p>
      </div>
    </aside>
  );
}
