import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/app-shell/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Client" };

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: client } = await supabase
    .from("clients")
    .select("id, name, contact_email, notes, created_at")
    .eq("id", id)
    .maybeSingle();

  if (!client) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={client.name} description={client.contact_email ?? ""} />
      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent className="whitespace-pre-wrap text-sm text-muted-foreground">
          {client.notes ?? "No notes."}
        </CardContent>
      </Card>
    </div>
  );
}
