"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-9 w-9 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-sunken)] animate-pulse" />
    );
  }

  const dark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-sunken)] text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] hover:bg-[var(--bg-canvas)] transition-colors"
      aria-label={dark ? "Passa a tema chiaro" : "Passa a tema scuro"}
    >
      {dark ? (
        <Sun className="size-[17px]" aria-hidden />
      ) : (
        <Moon className="size-[17px]" aria-hidden />
      )}
    </button>
  );
}
