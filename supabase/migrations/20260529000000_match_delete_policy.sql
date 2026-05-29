-- Add DELETE policy for matches table.
-- The original sprint4 migration only defined SELECT, INSERT, and UPDATE
-- policies. Without a DELETE policy, RLS silently blocks all deletes, so
-- cancelPendingMatch and unmatch were no-ops even though the GRANT existed.

create policy "Users delete own matches"
  on matches for delete
  using (auth.uid() = requester_id or auth.uid() = target_id);
