import { PageHeader } from "@/components/app-shell/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "New website" };

export default function NewWebsitePage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="New website"
        description="Create a native site, or connect a GitHub repository."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-6 opacity-70">
          <CardHeader className="p-0">
            <CardTitle>Native website</CardTitle>
            <CardDescription>
              Build pages visually with Puck. Full component library and AI assistant.
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-6 p-0 text-xs text-muted-foreground">
            Available in Milestone 2 (visual editor).
          </CardContent>
        </Card>

        <Card className="p-6 opacity-70">
          <CardHeader className="p-0">
            <CardTitle>Connect GitHub</CardTitle>
            <CardDescription>
              Import an existing repository. We'll detect the framework and
              open isolated branches for AI edits.
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-6 p-0 text-xs text-muted-foreground">
            Available in Milestone 4 (GitHub integration).
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
