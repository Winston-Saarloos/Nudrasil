import { Skeleton } from "@/components/ui/skeleton";

export function ChartSkeleton({ height }: { height: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <Skeleton className="w-full" style={{ height }} />
    </div>
  );
}
