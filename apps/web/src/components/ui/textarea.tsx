import { cn } from "@/lib/utils/cn";
import * as React from "react";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[100px] w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)]/80 px-3 py-2.5 text-[13px] text-[var(--fg-primary)] shadow-sm transition-colors",
          "placeholder:text-[var(--fg-muted)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brass)]/35",
          "disabled:cursor-not-allowed disabled:opacity-50 resize-y",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
