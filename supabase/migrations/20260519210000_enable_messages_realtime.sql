-- Enable Supabase Realtime for the messages table so postgres_changes
-- subscriptions in the chat screen receive INSERT events in real time.
alter publication supabase_realtime add table messages;
