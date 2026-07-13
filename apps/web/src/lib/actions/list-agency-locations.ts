"use server";

import { createClient } from "@/lib/supabase/server";

export type AgencyLocationOption = { id: string; name: string };

/**
 * Restituisce le sedi attive (Sede) dell'agenzia dell'utente corrente,
 * ordinate per nome. Usato per popolare il selettore Sede in creazione e
 * modifica immobile. Restituisce un array vuoto se l'utente non ha
 * membership su nessuna agenzia, o se l'agenzia non ha ancora sedi
 * configurate — in entrambi i casi il chiamante deve gestire con grazia
 * (Sede opzionale quando l'elenco e' vuoto).
 */
export async function listAgencyLocations(): Promise<AgencyLocationOption[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: membership } = await supabase
    .from("agency_members")
    .select("agency_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!membership?.agency_id) return [];

  const { data } = await supabase
    .from("agency_locations")
    .select("id, name")
    .eq("agency_id", membership.agency_id)
    .eq("status", "active")
    .order("name", { ascending: true });

  return data ?? [];
}

/**
 * Variante per contesti dove l'agency_id e' gia' noto (es. pagina di
 * modifica di un immobile specifico), per evitare una query aggiuntiva
 * di risoluzione membership quando non serve.
 */
export async function listAgencyLocationsForAgency(
  agencyId: string,
): Promise<AgencyLocationOption[]> {
  if (!agencyId) return [];
  const supabase = await createClient();

  const { data } = await supabase
    .from("agency_locations")
    .select("id, name")
    .eq("agency_id", agencyId)
    .eq("status", "active")
    .order("name", { ascending: true });

  return data ?? [];
}
