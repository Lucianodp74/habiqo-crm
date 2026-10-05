-- ════════════════════════════════════════════════════════════════
-- HABIQUO · 0027_property_video
-- Link a un video dell'immobile (YouTube / Vimeo) mostrato nella
-- pagina pubblica dell'annuncio. Si salva solo il link: il video
-- resta sulla piattaforma, niente upload pesanti sul nostro storage.
-- ════════════════════════════════════════════════════════════════

alter table public.properties
  add column if not exists video_url text;

alter table public.properties
  drop constraint if exists properties_video_url_length;
alter table public.properties
  add constraint properties_video_url_length
  check (video_url is null or char_length(video_url) <= 500);

comment on column public.properties.video_url is
  'Link YouTube o Vimeo del video dell''immobile, mostrato incorporato nella pagina pubblica.';
