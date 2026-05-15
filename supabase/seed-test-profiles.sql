-- HomeWithin — Seed 4 test profiles for the Connect / peer-matching screen.
--
-- Run this in the Supabase SQL editor (https://supabase.com/dashboard/project/_/sql).
-- Requires service-role access (the SQL editor runs as superuser, so this works).
--
-- These users have real auth rows so they satisfy the FK on user_profiles.user_id.
-- Passwords are set so you *could* sign in as them via email/password if needed:
--   email:    test1@homewithin.test ... test4@homewithin.test
--   password: testpass123
--
-- Re-running is safe: it upserts profiles and skips existing auth users.

do $$
declare
  v_uid uuid;
  v_users jsonb := jsonb_build_array(
    jsonb_build_object(
      'email',      'test1@homewithin.test',
      'nickname',   'River',
      'age',        '18-24',
      'language',   'English',
      'country',    'United States',
      'needs',      array['listen', 'vent'],
      'intentions', array['listener', 'first_friend']
    ),
    jsonb_build_object(
      'email',      'test2@homewithin.test',
      'nickname',   'Sky',
      'age',        '25-34',
      'language',   'English',
      'country',    'Canada',
      'needs',      array['advice', 'friendship'],
      'intentions', array['mentor', 'first_friend', 'support_group']
    ),
    jsonb_build_object(
      'email',      'test3@homewithin.test',
      'nickname',   'Sage',
      'age',        '18-24',
      'language',   'Spanish',
      'country',    'Mexico',
      'needs',      array['listen', 'friendship'],
      'intentions', array['family_rejection', 'listener']
    ),
    jsonb_build_object(
      'email',      'test4@homewithin.test',
      'nickname',   'Wren',
      'age',        '35-44',
      'language',   'English',
      'country',    'United Kingdom',
      'needs',      array['vent', 'advice'],
      'intentions', array['mentor', 'family_rejection', 'support_group']
    )
  );
  v_user jsonb;
begin
  for v_user in select * from jsonb_array_elements(v_users)
  loop
    -- Reuse existing auth user if email already present, else create one.
    select id into v_uid from auth.users where email = v_user->>'email';

    if v_uid is null then
      v_uid := gen_random_uuid();

      insert into auth.users (
        id,
        instance_id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
      ) values (
        v_uid,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        v_user->>'email',
        crypt('testpass123', gen_salt('bf')),
        now(),
        jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
        '{}'::jsonb,
        now(),
        now(),
        '',
        '',
        '',
        ''
      );

      insert into auth.identities (
        id,
        user_id,
        provider_id,
        identity_data,
        provider,
        last_sign_in_at,
        created_at,
        updated_at
      ) values (
        gen_random_uuid(),
        v_uid,
        v_uid::text,
        jsonb_build_object('sub', v_uid::text, 'email', v_user->>'email'),
        'email',
        now(),
        now(),
        now()
      );
    end if;

    insert into user_profiles (
      user_id, nickname, age_range, language, country, needs, intentions, hide_from_search
    ) values (
      v_uid,
      v_user->>'nickname',
      v_user->>'age',
      v_user->>'language',
      v_user->>'country',
      array(select jsonb_array_elements_text(v_user->'needs')),
      array(select jsonb_array_elements_text(v_user->'intentions')),
      false
    )
    on conflict (user_id) do update
      set nickname         = excluded.nickname,
          age_range        = excluded.age_range,
          language         = excluded.language,
          country          = excluded.country,
          needs            = excluded.needs,
          intentions       = excluded.intentions,
          hide_from_search = false,
          updated_at       = now();
  end loop;
end $$;

-- Quick check
select user_id, nickname, age_range, language, country, needs, intentions
from user_profiles
where nickname in ('River', 'Sky', 'Sage', 'Wren');
