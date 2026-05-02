import { type VariantProps, tv } from "tailwind-variants";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/cn";

const pill = tv({
  base: [
    "inline-flex items-center gap-1.5",
    "px-2.5 py-1 rounded-full",
    "text-[11px] font-medium leading-none",
    "whitespace-nowrap",
  ],
  variants: {
    tone: {
      neutral: "bg-[var(--bg-sunken)] text-[var(--color-onyx-700)]",
      warm: "bg-[rgba(179,106,58,0.10)] text-[var(--color-warning)]",
      positive: "bg-[rgba(92,123,90,0.10)] text-[var(--color-positive)]",
      danger: "bg-[rgba(140,74,59,0.10)] text-[var(--color-danger)]",
      brass: "bg-[var(--color-brass-glow)] text-[var(--color-brass-deep)]",
    },
  },
  defaultVariants: { tone: "neutral" },
});

const dotColor: Record<NonNullable<VariantProps<typeof pill>["tone"]>, string> = {
  neutral: "bg-[var(--color-onyx-400)]",
  warm: "bg-[var(--color-warning)]",
  positive: "bg-[var(--color-positive)]",
  danger: "bg-[var(--color-danger)]",
  brass: "bg-[var(--color-brass)]",
};

export type PillProps = HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof pill> & {
    dot?: boolean;
    icon?: ReactNode;
  };

export function Pill({ tone, dot, icon, className, children, ...props }: PillProps) {
  const t = tone ?? "neutral";
  return (
    <span className={cn(pill({ tone: t }), className)} {...props}>
      {dot ? (
        <span
          aria-hidden
          className={cn("h-1.5 w-1.5 rounded-full animate-pulse", dotColor[t])}
        />
      ) : null}
      {icon ? <span aria-hidden>{icon}</span> : null}
      {children}
    </span>
  );
}
