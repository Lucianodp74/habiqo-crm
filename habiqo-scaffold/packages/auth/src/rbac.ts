import type { AgencyRole } from "@habiquo/types";

/**
 * RBAC permissions matrix.
 *
 * Defense in depth: this is the application-layer check. RLS policies
 * in Postgres enforce the same rules at the data layer. Both must agree.
 *
 * To add a new permission:
 *   1. Add the key here with its allowed roles
 *   2. Add a matching RLS policy in supabase/migrations
 *   3. Call `can(role, "your:permission")` in your server action
 */
export const PERMISSIONS = {
  // Leads
  "leads:read": ["owner", "admin", "agent", "viewer"],
  "leads:write": ["owner", "admin", "agent"],
  "leads:assign": ["owner", "admin"],
  "leads:delete": ["owner", "admin"],
  "leads:export": ["owner", "admin"],

  // Properties
  "properties:read": ["owner", "admin", "agent", "viewer"],
  "properties:write": ["owner", "admin", "agent"],
  "properties:publish": ["owner", "admin", "agent"],
  "properties:delete": ["owner", "admin"],

  // Valuations
  "valuations:read": ["owner", "admin", "agent", "viewer"],
  "valuations:create": ["owner", "admin", "agent"],

  // Documents
  "documents:read": ["owner", "admin", "agent", "viewer"],
  "documents:write": ["owner", "admin", "agent"],
  "documents:delete": ["owner", "admin"],

  // AI
  "ai:use": ["owner", "admin", "agent"],
  "ai:configure": ["owner", "admin"],
  "ai:view-cost": ["owner", "admin"],

  // Team
  "team:read": ["owner", "admin", "agent", "viewer"],
  "team:invite": ["owner", "admin"],
  "team:remove": ["owner"],
  "team:change-role": ["owner"],

  // Billing
  "billing:read": ["owner", "admin"],
  "billing:manage": ["owner"],

  // Agency settings
  "agency:read": ["owner", "admin", "agent", "viewer"],
  "agency:edit": ["owner", "admin"],
} as const satisfies Record<string, readonly AgencyRole[]>;

export type Permission = keyof typeof PERMISSIONS;

/**
 * Check if a role has a permission.
 *
 * @example
 *   if (!can(member.role, "leads:delete")) {
 *     return { ok: false, error: { code: "forbidden", message: "..." } };
 *   }
 */
export function can(role: AgencyRole, permission: Permission): boolean {
  return (PERMISSIONS[permission] as readonly AgencyRole[]).includes(role);
}

/**
 * Throw if role lacks permission. Useful in server actions where
 * the failure case is handled by the surrounding try/catch.
 */
export function require_(role: AgencyRole, permission: Permission): void {
  if (!can(role, permission)) {
    throw new ForbiddenError(`Role "${role}" lacks permission "${permission}"`);
  }
}

export class ForbiddenError extends Error {
  override readonly name = "ForbiddenError";
}

export class UnauthenticatedError extends Error {
  override readonly name = "UnauthenticatedError";
}
