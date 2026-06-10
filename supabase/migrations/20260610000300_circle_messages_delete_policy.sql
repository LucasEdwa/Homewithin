-- Allow members to delete their own circle messages.
create policy "Members delete own circle messages"
  on circle_messages for delete
  using (auth.uid() = sender_id);
