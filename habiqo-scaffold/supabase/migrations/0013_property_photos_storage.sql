-- =====================================================================
-- Migration 0013 — Property photos storage
-- =====================================================================
-- Storage-only migration. No schema changes: the `photos text[]` column
-- on the `properties` table already exists from Sprint 0-1 work.
--
-- This migration:
--   1. Creates the `property-photos` Supabase Storage bucket
--      (public reads, authenticated writes).
--   2. Adds bucket-scoped RLS policies on `storage.objects`.
--
-- Cover-image convention (enforced at application layer):
--   `properties.photos[0]` is the cover image. Subsequent indices form
--   the gallery in display order. The `set-property-photo-cover` server
--   action reorders the array by moving the chosen path to index 0.
--
-- Path convention (enforced at server-action level, not in policies):
--   property-photos/agencies/{agency_id}/properties/{property_id}/{uuid}.{ext}
--
-- Security note:
--   Policies below are permissive: any authenticated user can write to
--   the bucket. Real membership/role enforcement lives in the server
--   actions, which validate `agency_members.role` before any upload or
--   delete. Defense-in-depth via path-based policies can be added in a
--   later migration without breaking this one.
-- =====================================================================

-- ----- Bucket ---------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'property-photos',
  'property-photos',
  true,                                                  -- public reads
  5242880,                                               -- 5 MB per file
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update set
  public            = excluded.public,
  file_size_limit   = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ----- Policies on storage.objects ------------------------------------

-- Public read for property-photos bucket only.
drop policy if exists "property_photos_public_read" on storage.objects;
create policy "property_photos_public_read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'property-photos');

-- Authenticated insert on property-photos bucket only.
drop policy if exists "property_photos_authenticated_insert" on storage.objects;
create policy "property_photos_authenticated_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'property-photos');

-- Authenticated update on property-photos bucket only.
drop policy if exists "property_photos_authenticated_update" on storage.objects;
create policy "property_photos_authenticated_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'property-photos')
  with check (bucket_id = 'property-photos');

-- Authenticated delete on property-photos bucket only.
drop policy if exists "property_photos_authenticated_delete" on storage.objects;
create policy "property_photos_authenticated_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'property-photos');

-- ----- Sanity checks --------------------------------------------------

do $$
begin
  -- Bucket created and configured.
  if not exists (select 1 from storage.buckets where id = 'property-photos') then
    raise exception 'property-photos bucket was not created';
  end if;

  -- All 4 policies present.
  if (
    select count(*)
    from pg_policy
    where polrelid = 'storage.objects'::regclass
      and polname like 'property_photos_%'
  ) <> 4 then
    raise exception 'Expected 4 property_photos_* policies on storage.objects';
  end if;

  raise notice 'Migration 0013 applied: bucket + 4 policies in place.';
end$$;
