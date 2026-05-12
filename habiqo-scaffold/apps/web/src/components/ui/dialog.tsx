"use client";

/**
 * TEMPORARY STUB · Dialog component.
 *
 * The original Radix-based Dialog cannot resolve its peer
 * dependency `@radix-ui/react-dismissable-layer` because pnpm's
 * deeply-nested symlink paths exceed Windows' 260-char MAX_PATH
 * limit on this machine. The dep IS present in the pnpm store but
 * the symlink inside react-dialog's node_modules fails to create.
 *
 * Until we move to a shorter project path or enable Windows long
 * paths, we replace this file with a stub that compiles without
 * any Radix dependency. The "Add new lead" modal in the CRM
 * /leads page will render its trigger button but the modal itself
 * won't appear. The Habita public site is unaffected (it doesn't
 * use Dialog).
 *
 * RESTORE: when the dep issue is fixed, run
 *   git checkout HEAD -- apps/web/src/components/ui/dialog.tsx
 * to bring back the real Radix-based implementation.
 */
import * as React from "react";

type DialogProps = {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
  modal?: boolean;
};

type WithAsChild = {
  children?: React.ReactNode;
  asChild?: boolean;
};

export function Dialog({ children }: DialogProps) {
  return <>{children}</>;
}

export function DialogTrigger({ children }: WithAsChild) {
  return <>{children}</>;
}

export function DialogPortal({
  children: _children,
}: {
  children?: React.ReactNode;
}) {
  return null;
}

export function DialogOverlay(_props: React.HTMLAttributes<HTMLDivElement>) {
  return null;
}

export function DialogContent(
  _props: React.HTMLAttributes<HTMLDivElement> & {
    children?: React.ReactNode;
  }
) {
  return null;
}

export function DialogHeader({
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props}>{children}</div>;
}

export function DialogFooter({
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props}>{children}</div>;
}

export function DialogTitle({
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 {...props}>{children}</h2>;
}

export function DialogDescription({
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p {...props}>{children}</p>;
}

export function DialogClose({ children }: WithAsChild) {
  return <>{children}</>;
}
