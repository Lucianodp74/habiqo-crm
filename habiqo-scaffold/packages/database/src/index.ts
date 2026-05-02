export type { Database, Json } from "./types";

/**
 * Helper to extract a row type for a given table name.
 *
 * @example
 *   import type { Tables } from "@habiqo/database";
 *   type LeadRow = Tables<"leads">;
 */
import type { Database } from "./types";

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T] extends { Row: infer R } ? R : never;

export type Inserts<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T] extends { Insert: infer I } ? I : never;

export type Updates<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T] extends { Update: infer U } ? U : never;
