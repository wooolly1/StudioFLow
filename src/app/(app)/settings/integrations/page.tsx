import { PageHeader } from "@/components/app-shell/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Integrations" };

export default function IntegrationsPage() {
  const items = [
    { name: "GitHub", status: "Not connected", desc: "Required for imported websites." },
    { name: "Vercel", status: "Not connected", desc: "Required for deployments and domains." },
    { name: "Claude AI", status: "Server-side ready", desc: "Wire ANTHROPIC_API_KEY in Milestone 3." },
  ];
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Integrations"
        description="Connect external services. Tokens are stored encrypted and never shipped to the browser."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((i) => (
          <Card key={i.name}>
            <CardHeader>
              <CardTitle>{i.name}</CardTitle>
              <CardDescription>{i.desc}</CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">{i.status}</CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
