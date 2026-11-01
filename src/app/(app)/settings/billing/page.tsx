import { PageHeader } from "@/components/app-shell/page-header";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Billing" };

export default function BillingPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Billing"
        description="Plan and invoices."
      />
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Billing is not wired up in Milestone 1. Stripe (or similar) integration is planned.
        </CardContent>
      </Card>
    </div>
  );
}
