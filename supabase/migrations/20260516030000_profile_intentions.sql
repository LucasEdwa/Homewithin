-- HomeWithin — Add `intentions` to user_profiles so peers can be filtered
-- by what they're open to offering (mentor, listener, etc.).

alter table user_profiles
  add column if not exists intentions text[] default '{}';

-- GIN index lets us efficiently filter with `intentions @> ARRAY['mentor']` /
-- `intentions && ARRAY[...]` queries.
create index if not exists user_profiles_intentions_gin
  on user_profiles using gin (intentions);
