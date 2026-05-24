-- HomeWithin — Add avatar_url to user_profiles
-- Stores the public URL of a user's profile photo (Supabase Storage, avatars bucket).
alter table user_profiles add column if not exists avatar_url text;