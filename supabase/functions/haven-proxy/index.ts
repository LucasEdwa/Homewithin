// Supabase Edge Function — haven-proxy
// Proxies requests to second-horizon.com/chat server-side so the API key
// is never exposed to the client.
//
// Deploy:
//   supabase functions deploy haven-proxy
//   supabase secrets set HAVEN_API_KEY=haven_...

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return json({ ok: true });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const havenApiKey = Deno.env.get("HAVEN_API_KEY");

  if (!supabaseUrl || !anonKey || !havenApiKey) {
    return json({ error: "Server misconfigured" }, 500);
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return json({ error: "Missing bearer token" }, 401);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) {
    return json({ error: "Invalid session" }, 401);
  }

  const body = await req.json().catch(() => ({}));
  const { session_id, message } = body as {
    session_id?: string;
    message?: string;
  };

  if (!session_id || !message) {
    return json({ error: "session_id and message are required" }, 400);
  }

  const upstream = await fetch("https://app.second-horizon.com/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": havenApiKey,
    },
    body: JSON.stringify({ session_id, message }),
  });

  if (!upstream.ok) {
    const errText = await upstream.text();
    console.error("[haven-proxy] upstream error:", errText);
    return json({ error: "AI endpoint error" }, 502);
  }

  const data = await upstream.json();
  return json({ reply: data.reply ?? null });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
