import { type VariantProps, tv } from "tailwind-variants";
import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "../lib/cn";

const button = tv({
  base: [
    "inline-flex items-center justify-center gap-2",
    "font-medium whitespace-nowrap",
    "rounded-md",
    "transition-all duration-200 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    "focus-visible:ring-[var(--accent)] focus-visible:ring-offset-[var(--bg-canvas)]",
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
  ],
  variants: {
    intent: {
      primary: [
        "bg-[var(--color-onyx-900)] text-[var(--fg-on-onyx)]",
        "hover:scale-[1.02] hover:bg-[var(--color-onyx-950)]",
        "active:scale-[0.99]",
      ],
      secondary: [
        "bg-[var(--bg-elevated)] text-[var(--fg-primary)]",
        "border border-[var(--border-strong)]",
        "hover:bg-[var(--bg-sunken)]",
      ],
      ghost: [
        "text-[var(--fg-secondary)]",
        "hover:bg-[var(--bg-sunken)] hover:text-[var(--fg-primary)]",
      ],
      brass: [
        "bg-[var(--accent)] text-[var(--fg-on-onyx)]",
        "hover:bg-[var(--accent-deep)]",
      ],
      danger: [
        "bg-[var(--color-danger)] text-[var(--fg-on-onyx)]",
        "hover:opacity-90",
      ],
    },
    size: {
      sm: "h-8 px-3 text-[12px]",
      md: "h-9 px-3.5 text-[13px]",
      lg: "h-11 px-5 text-[14px]",
      icon: "h-9 w-9 p-0",
    },
    fullWidth: {
      true: "w-full",
    },
  },
  defaultVariants: {
    intent: "secondary",
    size: "md",
  },
});

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof button> & {
    /** When true, shows a spinner and disables interaction. */
    loading?: boolean;
  };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ intent, size, fullWidth, loading, disabled, className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(button({ intent, size, fullWidth }), className)}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? (
          <span
            aria-hidden
            className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin"
          />
        ) : null}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
