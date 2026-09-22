alter table messages add column if not exists liked boolean not null default false;
alter table messages add column if not exists reply_to_id uuid references messages(id) on delete set null;
alter table messages add column if not exists reply_to_body text;
alter table messages add column if not exists reply_to_sender_id uuid;

notify pgrst, 'reload schema';
