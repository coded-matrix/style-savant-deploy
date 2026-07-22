import { cn } from "@/lib/utils";

export function Eyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-mid-grey", className)}>
      {children}
    </p>
  );
}
