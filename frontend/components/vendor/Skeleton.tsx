import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "shimmer bg-surface-high dark:bg-white/10 rounded",
        className
      )}
    />
  );
}
