-- Migrate check_ins.id from client-generated text to DB-generated uuid.
-- Safe to run before production launch (no shipped users).
-- Existing rows get new UUIDs; the unique constraint (user_id, date) is preserved.

alter table check_ins drop constraint check_ins_pkey;
alter table check_ins drop column id;
alter table check_ins add column id uuid default gen_random_uuid() not null;
alter table check_ins add primary key (id);
