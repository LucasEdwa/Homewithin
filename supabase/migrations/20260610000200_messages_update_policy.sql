-- Allow the sender to update their own messages (expiry, delete scenarios).
-- Allow the non-sender participant to set liked = true/false.
-- Without these, RLS silently rejects all UPDATE calls — including toggleMessageLike.

create policy "Sender can update own messages"
  on messages for update
  using (auth.uid() = sender_id)
  with check (auth.uid() = sender_id);

create policy "Match participant can like messages"
  on messages for update
  using (
    auth.uid() != sender_id
    and exists (
      select 1 from matches
      where matches.id = messages.match_id
        and (matches.requester_id = auth.uid() or matches.target_id = auth.uid())
        and matches.status = 'accepted'
    )
  )
  with check (
    auth.uid() != sender_id
    and exists (
      select 1 from matches
      where matches.id = messages.match_id
        and (matches.requester_id = auth.uid() or matches.target_id = auth.uid())
        and matches.status = 'accepted'
    )
  );
