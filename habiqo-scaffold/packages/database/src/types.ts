/**
 * AUTO-GENERATED — do not edit manually.
 *
 * NOTE: In this scaffold we ship a minimal schema to keep TS and Supabase SSR typed.
 * Replace by running the Supabase type generator once your local/hosted project is running:
 *   pnpm db:types
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Relationship = {
  foreignKeyName: string;
  columns: string[];
  referencedRelation: string;
  referencedColumns: string[];
  isOneToOne?: boolean;
};

type ProfilesRow = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

type LeadsRow = {
  id: string;
  agency_id: string;
  assigned_to: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  status: string;
  temperature: string | null;
  source: string;
  source_detail: string | null;
  ai_score: number | null;
  conversion_probability: number | null;
  budget_min_eur: number | null;
  budget_max_eur: number | null;
  preferred_zones: string[] | null;
  tags: string[] | null;
  notes: string | null;
  last_activity_at: string | null;
  created_at: string;
  updated_at: string;
};

type LeadEventsRow = {
  id: string;
  lead_id: string;
  type: string;
  title: string;
  detail: string | null;
  metadata: Json | null;
  actor_id: string | null;
  occurred_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfilesRow;
        Insert: Partial<ProfilesRow>;
        Update: Partial<ProfilesRow>;
        Relationships: Relationship[];
      };
      leads: {
        Row: LeadsRow;
        Insert: Partial<LeadsRow>;
        Update: Partial<LeadsRow>;
        Relationships: Relationship[];
      };
      lead_events: {
        Row: LeadEventsRow;
        Insert: Partial<LeadEventsRow>;
        Update: Partial<LeadEventsRow>;
        Relationships: Relationship[];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

