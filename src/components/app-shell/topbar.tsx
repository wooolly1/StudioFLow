import { logout } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function Topbar({
  email,
  displayName,
}: {
  email: string;
  displayName: string | null;
}) {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b border-border bg-background/80 px-4 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Signed in as</span>
        <span className="text-sm font-medium">{displayName ?? email}</span>
      </div>
      <form action={logout}>
        <Button type="submit" variant="ghost" size="sm">
          <LogOut className="h-4 w-4" aria-hidden />
          Sign out
        </Button>
      </form>
    </header>
  );
}
