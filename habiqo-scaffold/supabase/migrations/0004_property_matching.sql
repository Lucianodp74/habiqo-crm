-- ════════════════════════════════════════════════════════════════
-- HABIQUO · 0004_property_matching
-- pgvector similarity function called by RAG layer.
-- ════════════════════════════════════════════════════════════════

create or replace function match_properties(
  p_query_embedding vector(1024),
  p_agency_id       uuid,
  p_match_count     integer default 10,
  p_min_similarity  float default 0.7
)
returns table (
  id          uuid,
  title       text,
  city        text,
  price_eur   integer,
  rooms       smallint,
  sqm         integer,
  similarity  float
)
language sql
stable
security invoker
as $$
  select
    p.id,
    p.title,
    p.city,
    p.price_eur,
    p.rooms,
    p.sqm,
    1 - (p.embedding <=> p_query_embedding) as similarity
  from properties p
  where
    p.agency_id = p_agency_id
    and p.status = 'active'
    and p.embedding is not null
    and 1 - (p.embedding <=> p_query_embedding) >= p_min_similarity
  order by p.embedding <=> p_query_embedding
  limit p_match_count;
$$;
