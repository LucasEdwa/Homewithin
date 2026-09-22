-- Performance indexes for the chat system.
--
-- messages.expires_at: speeds up the "filter expired messages" clause in getMessages()
--   and the server-side purge job.
-- messages.sender_id: speeds up RLS policy evaluation (sender_id = auth.uid()) on
--   INSERT / UPDATE and the block-user lookup that searches by sender.
-- matches (requester_id, target_id, status): the RLS EXISTS sub-query on messages runs
--   this join on every SELECT/realtime event — a composite index makes it a fast index scan.

create index if not exists messages_expires_at
  on messages (expires_at)
  where expires_at is not null;

create index if not exists messages_sender
  on messages (sender_id);

create index if not exists matches_participants_status
  on matches (requester_id, target_id, status);
