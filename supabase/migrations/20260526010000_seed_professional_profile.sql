-- Seed one visible professional profile for beta testing.
-- Uses the earliest auth user so the record can be viewed immediately in-app.

do $$
declare
  v_user_id uuid;
begin
  select id
    into v_user_id
  from auth.users
  order by created_at asc
  limit 1;

  if v_user_id is null then
    raise notice 'No auth.users found. Skipping professional seed.';
    return;
  end if;

  update user_profiles
  set role = 'professional'
  where user_id = v_user_id;

  insert into professional_profiles (
    id,
    display_name,
    title,
    bio,
    specialties,
    languages,
    license_number,
    license_verified,
    session_price_sek_ore,
    is_active
  )
  values (
    v_user_id,
    'Alex Morgan',
    'Licensed Therapist',
    'Trauma-informed LGBTQ+ affirming therapist focused on anxiety, identity, and relationships.',
    array['therapist', 'anxiety', 'relationships']::text[],
    array['English', 'Swedish']::text[],
    'BETA-LIC-001',
    true,
    85000,
    true
  )
  on conflict (id) do update
  set
    display_name = excluded.display_name,
    title = excluded.title,
    bio = excluded.bio,
    specialties = excluded.specialties,
    languages = excluded.languages,
    license_number = excluded.license_number,
    license_verified = excluded.license_verified,
    session_price_sek_ore = excluded.session_price_sek_ore,
    is_active = excluded.is_active;
end
$$;
