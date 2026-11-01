import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/app-shell/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Website" };

export default async function WebsiteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: website } = await supabase
    .from("websites")
    .select("id, name, slug, status, source, github_repo, updated_at")
    .eq("id", id)
    .maybeSingle();

  if (!website) notFound();

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title={website.name} description={`${website.source} · ${website.status}`} />
      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
          <CardDescription>
            Slug: <code className="font-mono text-xs">{website.slug}</code>
            {website.github_repo ? ` · Repo: ${website.github_repo}` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          The editor, deployments, and domain management will appear here once
          those milestones ship.
        </CardContent>
      </Card>
    </div>
  );
}
