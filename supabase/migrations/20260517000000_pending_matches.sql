-- Add 'pending' status for one-sided likes (waiting for mutual match)
-- Previously all likes were immediately 'accepted' which bypassed mutual consent.

alter table matches drop constraint if exists matches_status_check;

alter table matches
  add constraint matches_status_check
  check (status in ('pending', 'accepted', 'passed', 'blocked'));

-- Default new rows to pending so a like only becomes a chat after both sides connect
alter table matches alter column status set default 'pending';

-- Index already exists for (requester_id, status) and (target_id, status) from sprint4
