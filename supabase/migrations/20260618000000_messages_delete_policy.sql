-- Allow the sender to delete their own direct chat messages.
-- Without this policy, RLS blocks all deletes on the messages table
-- and deleteMessage() returns 0 rows silently.
create policy "Sender can delete own messages"
  on messages for delete
  using (auth.uid() = sender_id);
