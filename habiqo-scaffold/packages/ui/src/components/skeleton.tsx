import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

/**
 * Loading skeleton with shimmer animation. Match the shape of
 * the final content for the lowest perceived latency.
 */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn(
        "rounded-md",
        "bg-[var(--bg-sunken)]",
        "relative overflow-hidden",
        "before:absolute before:inset-0",
        "before:bg-gradient-to-r before:from-transparent before:via-[var(--bg-elevated)] before:to-transparent",
        "before:animate-[shimmer_1.6s_ease-in-out_infinite]",
        className,
      )}
      {...props}
    />
  );
}
