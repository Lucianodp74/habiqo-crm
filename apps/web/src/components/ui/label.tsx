"use client";

import { cn } from "@/lib/utils/cn";
import * as LabelPrimitive from "@radix-ui/react-label";
import * as React from "react";
import { tv } from "tailwind-variants";

const labelVariants = tv({
  base: "text-[11px] font-medium font-mono uppercase tracking-[0.12em] text-[var(--fg-muted)] leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
});

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root ref={ref} className={cn(labelVariants(), className)} {...props} />
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
