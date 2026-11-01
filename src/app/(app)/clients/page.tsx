import { Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/app-shell/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Card } from "@/components/ui/card";
import Link from "next/link";

export const metadata = { title: "Clients" };

export default async function ClientsPage() {
  const supabase = await createClient();
  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, contact_email, updated_at")
    .order("updated_at", { ascending: false });

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Clients"
        description="Each client can own one or more websites. Permissions are scoped per-client in the portal."
      />
      {!clients || clients.length === 0 ? (
        <EmptyState
          icon={<Users className="h-5 w-5" />}
          title="No clients yet"
          description="Add your first client to assign them websites and give them a portal login."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((c) => (
            <Link key={c.id} href={`/clients/${c.id}`}>
              <Card className="p-5 transition-shadow hover:shadow-elevated">
                <p className="font-display text-lg font-semibold">{c.name}</p>
                {c.contact_email ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {c.contact_email}
                  </p>
                ) : null}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
