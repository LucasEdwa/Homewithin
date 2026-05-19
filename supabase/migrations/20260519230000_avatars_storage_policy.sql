-- Ensure the avatars bucket exists and is public (URLs readable without auth).
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

-- Drop existing policies so we can recreate them cleanly.
drop policy if exists "users can upload their own avatar"   on storage.objects;
drop policy if exists "users can update their own avatar"   on storage.objects;
drop policy if exists "users can delete their own avatar"   on storage.objects;
drop policy if exists "avatars are publicly readable"       on storage.objects;

-- Any authenticated user (including anonymous) may upload to their own folder.
create policy "users can upload their own avatar"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow overwriting (upsert) their own file.
create policy "users can update their own avatar"
on storage.objects for update
to authenticated
using (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow deleting their own file (e.g. on account deletion).
create policy "users can delete their own avatar"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- Anyone (including unauthenticated) can read avatar URLs.
create policy "avatars are publicly readable"
on storage.objects for select
to public
using (bucket_id = 'avatars');
