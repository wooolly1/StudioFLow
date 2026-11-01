import Link from "next/link";
import { PageHeader } from "@/components/app-shell/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, email, locale")
    .eq("id", user!.id)
    .maybeSingle();

  const sections = [
    { href: "/settings/team" as const, title: "Team & workspace", desc: "Members, roles, invites." },
    { href: "/settings/integrations" as const, title: "Integrations", desc: "GitHub, Vercel, custom domains." },
    { href: "/settings/billing" as const, title: "Billing", desc: "Plan and invoices." },
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Settings"
        description="Account and workspace preferences."
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your personal account details.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <Row k="Name" v={profile?.display_name ?? "—"} />
          <Row k="Email" v={profile?.email ?? user?.email ?? "—"} />
          <Row k="Locale" v={profile?.locale ?? "en"} />
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((s) => (
          <Link key={s.href} href={s.href}>
            <Card className="p-5 transition-shadow hover:shadow-elevated">
              <p className="font-display text-base font-semibold">{s.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 py-2 last:border-0">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium">{v}</span>
    </div>
  );
}
