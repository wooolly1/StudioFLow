import { Images } from "lucide-react";
import { PageHeader } from "@/components/app-shell/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata = { title: "Media" };

export default function MediaPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Media"
        description="Images and files, scoped to your workspace."
      />
      <EmptyState
        icon={<Images className="h-5 w-5" />}
        title="No assets yet"
        description="Upload images or other files to use across your websites. Storage is backed by Supabase."
      />
    </div>
  );
}
