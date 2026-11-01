import { PageHeader } from "@/components/app-shell/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Users } from "lucide-react";

export const metadata = { title: "Team" };

export default function TeamPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Team & workspace"
        description="Members, roles, and invites — scoped to a workspace."
      />
      <EmptyState
        icon={<Users className="h-5 w-5" />}
        title="Workspace management lands in Milestone 2"
        description="Create workspaces, invite members, assign roles (owner, admin, editor, viewer), and manage per-client permissions."
      />
    </div>
  );
}
