alter table public.circle_messages
  add column if not exists is_ai boolean not null default false,
  add column if not exists ai_name text;

alter table public.circle_messages
  alter column sender_id drop not null;

alter table public.circle_messages
  drop constraint if exists circle_messages_sender_or_ai_check;

alter table public.circle_messages
  add constraint circle_messages_sender_or_ai_check
  check (
    (is_ai = false and sender_id is not null and ai_name is null)
    or
    (is_ai = true and sender_id is null and coalesce(ai_name, '') <> '')
  );

drop policy if exists "Members send circle messages" on public.circle_messages;

create policy "Members send circle messages"
  on public.circle_messages for insert
  with check (
    is_ai = false
    and auth.uid() = sender_id
    and exists (
      select 1 from public.circle_members
      where circle_members.circle_id = circle_id
        and circle_members.user_id = auth.uid()
    )
  );
