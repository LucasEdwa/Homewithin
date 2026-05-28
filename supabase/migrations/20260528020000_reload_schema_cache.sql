-- Force PostgREST to reload its schema cache so it discovers
-- get_circle_member_profiles (created in 20260528010000).
select pg_notify('pgrst', 'reload schema');
