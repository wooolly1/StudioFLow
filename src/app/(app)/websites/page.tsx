import Link from "next/link";
import { Globe } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/app-shell/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const metadata = { title: "Websites" };

export default async function WebsitesPage() {
  const supabase = await createClient();
  const { data: websites } = await supabase
    .from("websites")
    .select("id, name, slug, status, source, updated_at")
    .order("updated_at", { ascending: false });

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Websites"
        description="Native sites built with the StudioFlow editor, plus any GitHub repositories you've connected."
        actions={
          <Link href="/websites/new" className={buttonVariants()}>
            New website
          </Link>
        }
      />

      {!websites || websites.length === 0 ? (
        <EmptyState
          icon={<Globe className="h-5 w-5" />}
          title="No websites yet"
          description="Create a native site to use the visual editor, or connect a GitHub repository for code-aware edits."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {websites.map((w) => (
            <Link key={w.id} href={`/websites/${w.id}`}>
              <Card className="p-5 transition-shadow hover:shadow-elevated">
                <p className="font-display text-lg font-semibold">{w.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {w.source === "github" ? "GitHub" : "Native"} · {w.status}
                </p>
                <p className="mt-4 text-xs text-muted-foreground">
                  Updated {new Date(w.updated_at).toLocaleDateString()}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
