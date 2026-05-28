"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export async function deleteProperty(propertyId: string): Promise<{ ok: boolean; error?: string }> {
  if (!propertyId) return { ok: false, error: "ID non valido" }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "Non autorizzato" }

  // Verifica appartenenza agenzia
  const { data: property } = await supabase
    .from("properties")
    .select("id, agency_id, slug")
    .eq("id", propertyId)
    .maybeSingle()

  if (!property) return { ok: false, error: "Immobile non trovato" }

  const { data: membership } = await supabase
    .from("agency_members")
    .select("role")
    .eq("agency_id", property.agency_id)
    .eq("user_id", user.id)
    .maybeSingle()

  if (!membership || !["owner", "admin", "agent"].includes(membership.role)) {
    return { ok: false, error: "Non hai i permessi" }
  }

  const { error } = await supabase
    .from("properties")
    .delete()
    .eq("id", propertyId)

  if (error) return { ok: false, error: error.message }

  revalidatePath("/admin/properties")
  return { ok: true }
}

