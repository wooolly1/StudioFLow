import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Globe, Users, Rocket, Sparkles } from "lucide-react";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const supabase = await createClient();

  // Current user is guaranteed by the (app) layout.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Memberships drive which orgs the user can see. RLS filters this per-user.
  const { data: memberships } = await supabase
    .from("organization_members")
    .select("organization_id, role, organizations:organization_id(name, slug)")
    .limit(5);

  const hasOrg = (memberships?.length ?? 0) > 0;

  // Pull website/client counts across the user's visible orgs. RLS filters rows.
  const [{ count: websiteCount }, { count: clientCount }] = await Promise.all([
    supabase.from("websites").select("id", { count: "exact", head: true }),
    supabase.from("clients").select("id", { count: "exact", head: true }),
  ]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">
          {new Intl.DateTimeFormat("en", {
            weekday: "long",
            day: "numeric",
            month: "long",
          }).format(new Date())}
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Welcome back{user?.email ? `, ${user.email.split("@")[0]}` : ""}
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Your studio at a glance. Create a workspace to start inviting
          collaborators and connecting client websites.
        </p>
      </div>

      {!hasOrg ? (
        <EmptyState
          icon={<Sparkles className="h-5 w-5" />}
          title="Create your first workspace"
          description="A workspace holds your clients, websites, team members, and integrations. You can rename or delete it at any time."
          action={
            <Link
              href="/settings/team"
              className={buttonVariants({ variant: "gold" })}
            >
              Create workspace
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            icon={<Globe className="h-4 w-4" />}
            label="Websites"
            value={websiteCount ?? 0}
            hint="Across all your workspaces"
          />
          <StatCard
            icon={<Users className="h-4 w-4" />}
            label="Clients"
            value={clientCount ?? 0}
            hint="Linked to your workspaces"
          />
          <StatCard
            icon={<Rocket className="h-4 w-4" />}
            label="Live deployments"
            value={0}
            hint="Wired in Milestone 3"
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent websites</CardTitle>
            <CardDescription>
              Websites you have access to in your workspaces.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RecentWebsites />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Milestone status</CardTitle>
            <CardDescription>What's shipped, what's next.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <MilestoneRow label="Foundation" state="done" />
            <MilestoneRow label="Workspaces & clients" state="next" />
            <MilestoneRow label="Visual editor (Puck)" state="todo" />
            <MilestoneRow label="AI assistant (Claude)" state="todo" />
            <MilestoneRow label="GitHub + Vercel" state="todo" />
            <MilestoneRow label="Client portal" state="todo" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between pb-2">
        <CardDescription>{label}</CardDescription>
        <span className="text-muted-foreground">{icon}</span>
      </CardHeader>
      <CardContent>
        <div className="font-display text-3xl font-semibold">{value}</div>
        {hint ? (
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

async function RecentWebsites() {
  const supabase = await createClient();
  const { data: websites } = await supabase
    .from("websites")
    .select("id, name, slug, status, source, updated_at")
    .order("updated_at", { ascending: false })
    .limit(5);

  if (!websites || websites.length === 0) {
    return (
      <EmptyState
        icon={<Globe className="h-5 w-5" />}
        title="No websites yet"
        description="Create a native website or connect a GitHub repository to get started."
        action={
          <Link href="/websites/new" className={buttonVariants()}>
            Add a website
          </Link>
        }
      />
    );
  }

  return (
    <ul className="divide-y divide-border">
      {websites.map((w) => (
        <li key={w.id} className="flex items-center justify-between py-3">
          <div>
            <Link
              href={`/websites/${w.id}`}
              className="font-medium hover:underline"
            >
              {w.name}
            </Link>
            <p className="text-xs text-muted-foreground">
              {w.source === "github" ? "GitHub" : "Native"} · {w.status}
            </p>
          </div>
          <time className="text-xs text-muted-foreground">
            {new Date(w.updated_at).toLocaleDateString()}
          </time>
        </li>
      ))}
    </ul>
  );
}

function MilestoneRow({
  label,
  state,
}: {
  label: string;
  state: "done" | "next" | "todo";
}) {
  const badge =
    state === "done"
      ? { text: "Shipped", cls: "bg-success/10 text-success" }
      : state === "next"
        ? { text: "Up next", cls: "bg-gold/15 text-gold-foreground" }
        : { text: "Planned", cls: "bg-muted text-muted-foreground" };
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge.cls}`}
      >
        {badge.text}
      </span>
    </div>
  );
}
