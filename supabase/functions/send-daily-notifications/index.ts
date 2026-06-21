// Supabase Edge Function: send-daily-notifications
//
// Sends personalized twice-daily push notifications to users based on what
// healing activities they haven't completed yet today (check-in, journal,
// lesson, AI companion, resource reading) and any unread circle messages.
//
// Called by pg_cron at 07:00 UTC (morning) and 19:00 UTC (evening).
// Deploy: supabase functions deploy send-daily-notifications
//
// POST body: { period: "morning" | "evening" }
// Auth: service role bearer token (sent by pg_cron job)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Period = "morning" | "evening";

interface PushPayload {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: string;
  channelId?: string;
}

// ─── Notification copy pools (rotated by user index for variety) ──────────────

const COPY: Record<Period, Record<string, string[]>> = {
  morning: {
    checkin: [
      "How are you feeling this morning?",
      "Take a moment to check in with yourself.",
      "Start your day by logging your mood.",
    ],
    journal: [
      "Write a few lines in your journal today.",
      "Your thoughts deserve a space this morning.",
      "A few words in your journal can ground your day.",
    ],
    lesson: [
      "Continue your healing program today.",
      "One lesson today is one step forward.",
      "A few minutes with your healing program goes a long way.",
    ],
    ai: [
      "Your AI companion is here to listen.",
      "Need to talk? Your companion is ready.",
      "A gentle chat with your AI companion can help.",
    ],
    resource: [
      "A short article might offer new perspective today.",
      "Explore a resource in the healing library.",
      "Knowledge is part of healing — check out a resource.",
    ],
  },
  evening: {
    checkin: [
      "Don't forget your evening check-in.",
      "How did today feel? Log your mood.",
      "Check in with how your day went.",
    ],
    journal: [
      "Write something in your journal before bed.",
      "Reflect on today in your journal.",
      "A few words can help you process the day.",
    ],
    lesson: [
      "Finish a lesson in your healing program tonight.",
      "A few minutes with your program before bed.",
      "Pick up where you left off in your healing journey.",
    ],
    ai: [
      "Your AI companion is here if you need to talk tonight.",
      "Process your day with your AI companion.",
      "Sometimes talking helps — your companion is listening.",
    ],
    resource: [
      "Wind down with a healing article tonight.",
      "A short read from the library before bed.",
      "End your day with something that supports your healing.",
    ],
  },
};

function pick(pool: string[], seed: number): string {
  return pool[Math.abs(seed) % pool.length];
}

interface UnreadCircle {
  circleId: string;
  circleName: string;
  count: number;
}

interface Missing {
  checkin: boolean;
  journal: boolean;
  lesson: boolean;
  ai: boolean;
  resource: boolean;
}

function buildActivityNotification(
  period: Period,
  missing: Missing,
  seed: number,
): { title: string; body: string; screen: string } | null {
  const items = Object.entries(missing)
    .filter(([, v]) => v)
    .map(([k]) => k);

  if (items.length === 0) return null;

  const title = period === "morning" ? "Good morning ☀️" : "Evening reflection 🌙";
  const copy = COPY[period];

  let body: string;
  let screen: string;

  if (items.length === 1) {
    const key = items[0];
    body = pick(copy[key], seed);
    screen = key === "checkin"
      ? "checkin"
      : key === "journal"
      ? "journal"
      : key === "lesson"
      ? "programs"
      : key === "resource"
      ? "resources"
      : "ai-companion";
  } else {
    const labels: Record<string, string> = {
      checkin: "check-in",
      journal: "journal",
      lesson: "healing program",
      ai: "AI companion",
      resource: "resource reading",
    };
    const named = items.map((k) => labels[k]);
    if (named.length === 2) {
      body = `Your ${named[0]} and ${named[1]} are waiting.`;
    } else {
      body = `Still to do today: ${named.slice(0, -1).join(", ")} and ${named[named.length - 1]}.`;
    }
    // Deep-link to the highest-priority missing item
    screen = missing.checkin
      ? "checkin"
      : missing.journal
      ? "journal"
      : missing.lesson
      ? "programs"
      : missing.resource
      ? "resources"
      : "ai-companion";
  }

  return { title, body, screen };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST")
    return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey)
    return json({ error: "Server misconfigured" }, 500);

  const { period = "morning" } = await req.json().catch(() => ({}));
  if (period !== "morning" && period !== "evening")
    return json({ error: 'period must be "morning" or "evening"' }, 400);

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD UTC
  const windowStart = `${today}T00:00:00Z`;
  const windowEnd = `${today}T23:59:59Z`;
  const circleWindowCutoff = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();

  // ── 1. Users with push tokens ─────────────────────────────────────────────
  const { data: users, error: usersErr } = await admin
    .from("user_profiles")
    .select("user_id, push_token, nickname")
    .not("push_token", "is", null);

  if (usersErr) {
    console.error("[send-daily-notifications] fetch users:", usersErr.message);
    return json({ error: usersErr.message }, 500);
  }
  if (!users?.length) return json({ sent: 0, reason: "no users with push tokens" }, 200);

  const userIds: string[] = users.map((u: any) => u.user_id);

  // ── 2. Bulk-fetch today's completions (one query per table) ───────────────
  const [
    { data: checkinRows },
    { data: journalRows },
    { data: lessonRows },
    { data: aiRows },
    { data: resourceRows },
    { data: memberRows },
  ] = await Promise.all([
    admin.from("check_ins").select("user_id").eq("date", today).in("user_id", userIds),
    admin.from("journal_entries").select("user_id").eq("date", today).in("user_id", userIds),
    admin.from("user_progress").select("user_id").gte("completed_at", windowStart).lte("completed_at", windowEnd).in("user_id", userIds),
    admin.from("ai_sessions").select("user_id").gte("created_at", windowStart).lte("created_at", windowEnd).in("user_id", userIds),
    admin.from("resource_reads").select("user_id").gte("created_at", windowStart).lte("created_at", windowEnd).in("user_id", userIds),
    admin.from("circle_members").select("circle_id, user_id").in("user_id", userIds),
  ]);

  const checkinDone = new Set((checkinRows ?? []).map((r: any) => r.user_id));
  const journalDone = new Set((journalRows ?? []).map((r: any) => r.user_id));
  const lessonDone = new Set((lessonRows ?? []).map((r: any) => r.user_id));
  const aiDone = new Set((aiRows ?? []).map((r: any) => r.user_id));
  const resourceDone = new Set((resourceRows ?? []).map((r: any) => r.user_id));

  // user → [circleId, ...]
  const userCircles = new Map<string, string[]>();
  for (const cm of (memberRows ?? [])) {
    const list = userCircles.get(cm.user_id) ?? [];
    list.push(cm.circle_id);
    userCircles.set(cm.user_id, list);
  }

  // ── 3. Unread circle messages (last 12 h) ─────────────────────────────────
  const allCircleIds = [...new Set((memberRows ?? []).map((cm: any) => cm.circle_id))];
  let circleUnreadRows: any[] = [];
  if (allCircleIds.length > 0) {
    const { data } = await admin
      .from("circle_messages")
      .select("circle_id, sender_id, circles(name)")
      .in("circle_id", allCircleIds)
      .gte("created_at", circleWindowCutoff);
    circleUnreadRows = data ?? [];
  }

  // ── 4. Build push batch ───────────────────────────────────────────────────
  const pushBatch: PushPayload[] = [];

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const uid: string = user.user_id;
    const token: string = user.push_token;

    const missing: Missing = {
      checkin: !checkinDone.has(uid),
      journal: !journalDone.has(uid),
      lesson: !lessonDone.has(uid),
      ai: !aiDone.has(uid),
      resource: !resourceDone.has(uid),
    };

    const allDone = !Object.values(missing).some(Boolean);

    // Unread circles for this user
    const myCircles = new Set(userCircles.get(uid) ?? []);
    const circleMap = new Map<string, UnreadCircle>();
    for (const msg of circleUnreadRows) {
      if (!myCircles.has(msg.circle_id)) continue;
      if (msg.sender_id === uid) continue;
      const existing = circleMap.get(msg.circle_id);
      if (existing) {
        existing.count++;
      } else {
        circleMap.set(msg.circle_id, {
          circleId: msg.circle_id,
          circleName: msg.circles?.name ?? "your circle",
          count: 1,
        });
      }
    }
    const unreadCircles = [...circleMap.values()].filter((c) => c.count > 0);

    if (allDone && unreadCircles.length === 0) continue;

    // Activity notification (what's missing today)
    if (!allDone) {
      const notif = buildActivityNotification(period as Period, missing, i);
      if (notif) {
        pushBatch.push({
          to: token,
          title: notif.title,
          body: notif.body,
          data: { screen: notif.screen },
          sound: "default",
          channelId: "daily",
        });
      }
    }

    // Circle notifications (cap at 2 per user)
    for (const circle of unreadCircles.slice(0, 2)) {
      pushBatch.push({
        to: token,
        title: "Your support circle 💬",
        body:
          circle.count === 1
            ? `New message in ${circle.circleName}`
            : `${circle.count} new messages in ${circle.circleName}`,
        data: { screen: "circle", circleId: circle.circleId },
        sound: "default",
        channelId: "circles",
      });
    }
  }

  if (pushBatch.length === 0)
    return json({ sent: 0, reason: "all users are up to date" }, 200);

  // ── 5. Send in chunks of 100 (Expo batch limit) ───────────────────────────
  let totalSent = 0;
  for (let i = 0; i < pushBatch.length; i += 100) {
    const chunk = pushBatch.slice(i, i + 100);
    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(chunk),
    });
    if (res.ok) {
      totalSent += chunk.length;
    } else {
      console.error(
        "[send-daily-notifications] Expo error:",
        await res.text(),
      );
    }
  }

  return json({ sent: totalSent, period }, 200);
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
