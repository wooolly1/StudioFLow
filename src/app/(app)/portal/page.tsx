import { PageHeader } from "@/components/app-shell/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { UserRoundCog } from "lucide-react";

export const metadata = { title: "Client portal" };

export default function PortalPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Client portal"
        description="Clients log in to review assigned websites, submit edits, and track approvals."
      />
      <EmptyState
        icon={<UserRoundCog className="h-5 w-5" />}
        title="Portal arrives in Milestone 5"
        description="Separate auth role, scoped RLS, request-for-change workflow, approval queue."
      />
    </div>
  );
}
