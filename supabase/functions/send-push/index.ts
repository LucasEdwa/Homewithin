// Supabase Edge Function: send-push
//
// Sends an Expo push notification to the other participant in a match
// when a new chat message is sent.
//
// Deploy:
//   supabase functions deploy send-push
//
// POST body: { matchId: string, body: string }
// Auth: caller's JWT in Authorization header

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !serviceKey || !anonKey) return json({ error: "Server misconfigured" }, 500);

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return json({ error: "Missing bearer token" }, 401);

  // Identify caller from their JWT.
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) return json({ error: "Invalid session" }, 401);
  const senderId = userData.user.id;

  const { matchId, body } = await req.json().catch(() => ({}));
  if (!matchId || !body) return json({ error: "matchId and body are required" }, 400);

  // Use service role for cross-user reads.
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Get match to find the recipient.
  const { data: match, error: matchErr } = await admin
    .from("matches")
    .select("requester_id, target_id")
    .eq("id", matchId)
    .single();
  if (matchErr || !match) return json({ error: "Match not found" }, 404);

  const recipientId = match.requester_id === senderId ? match.target_id : match.requester_id;

  // Get sender nickname + recipient push token in parallel.
  const [{ data: senderProfile }, { data: recipientProfile }] = await Promise.all([
    admin.from("user_profiles").select("nickname").eq("user_id", senderId).maybeSingle(),
    admin.from("user_profiles").select("push_token").eq("user_id", recipientId).maybeSingle(),
  ]);

  const pushToken = recipientProfile?.push_token;
  if (!pushToken) return json({ skipped: "recipient has no push token" }, 200);

  const senderName = senderProfile?.nickname ?? "Someone";

  // Send via Expo Push API.
  const expoPush = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      to: pushToken,
      title: senderName,
      body: body.length > 100 ? body.slice(0, 97) + "…" : body,
      data: { matchId },
      sound: "default",
      channelId: "chat",
    }),
  });

  if (!expoPush.ok) {
    const err = await expoPush.text();
    console.error("[send-push] Expo API error:", err);
    return json({ error: "Push delivery failed" }, 500);
  }

  return json({ sent: true }, 200);
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
