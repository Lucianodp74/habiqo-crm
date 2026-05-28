import { cn } from "@/lib/utils/cn";
import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { type VariantProps, tv } from "tailwind-variants";

const buttonVariants = tv({
  base: "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brass)]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-canvas)] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  variants: {
    variant: {
      default:
        "bg-[var(--color-onyx-900)] text-[var(--color-brass-soft)] shadow-sm hover:opacity-[0.96] active:opacity-90",
      secondary:
        "border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--fg-primary)] hover:bg-[var(--bg-sunken)]",
      ghost:
        "text-[var(--fg-secondary)] hover:bg-[var(--bg-sunken)] hover:text-[var(--fg-primary)]",
      link: "text-[var(--accent-deep)] underline-offset-4 hover:underline",
    },
    size: {
      default: "h-10 px-4 py-2",
      sm: "h-9 rounded-lg px-3 text-xs",
      lg: "h-11 rounded-xl px-6 text-[15px]",
      icon: "h-10 w-10",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size }), className)} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
