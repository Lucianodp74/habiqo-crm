import { Skeleton } from "@habiqo/ui";

export default function Loading() {
  return (
    <div className="px-8 py-8">
      <Skeleton className="h-8 w-48 mb-3" />
      <Skeleton className="h-4 w-32 mb-8" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-[300px] w-full" />
        ))}
      </div>
    </div>
  );
}
