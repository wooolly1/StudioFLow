import { cn } from "@/lib/utils";

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground"
        aria-hidden
      >
        <span className="font-display text-sm font-semibold">S</span>
      </div>
      {!compact && (
        <span className="font-display text-base font-semibold tracking-tight">
          StudioFlow
        </span>
      )}
    </div>
  );
}
