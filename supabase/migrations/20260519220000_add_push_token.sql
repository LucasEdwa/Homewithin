-- HomeWithin — Add push_token to user_profiles
-- Stores the Expo push notification token so the server can send match and message alerts.
alter table user_profiles add column if not exists push_token text;
