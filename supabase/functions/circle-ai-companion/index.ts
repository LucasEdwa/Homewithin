import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  buildCirclePrompt,
  selectConversationWindow,
  stripCompanionMention,
  type CirclePromptMessage,
} from '../_shared/circle-ai.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return json({ ok: true });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const openAiKey = Deno.env.get('OPENAI_API_KEY');
  if (!supabaseUrl || !serviceKey || !anonKey || !openAiKey) {
    return json({ error: 'Server misconfigured' }, 500);
  }

  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) {
    return json({ error: 'Missing bearer token' }, 401);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData?.user) {
    return json({ error: 'Invalid session' }, 401);
  }
  const userId = userData.user.id;

  const { circleId, triggerMessageId } = await req.json().catch(() => ({}));
  if (!circleId || !triggerMessageId) {
    return json({ error: 'circleId and triggerMessageId are required' }, 400);
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: membership } = await admin
    .from('circle_members')
    .select('user_id')
    .eq('circle_id', circleId)
    .eq('user_id', userId)
    .maybeSingle();
  if (!membership) {
    return json({ error: 'You are not a member of this circle' }, 403);
  }

  const { data: circle, error: circleError } = await admin
    .from('circles')
    .select('id, name, description, category')
    .eq('id', circleId)
    .single();
  if (circleError || !circle) {
    return json({ error: 'Circle not found' }, 404);
  }

  const { data: triggerMessage, error: triggerError } = await admin
    .from('circle_messages')
    .select('id, circle_id, sender_id, body, created_at')
    .eq('id', triggerMessageId)
    .eq('circle_id', circleId)
    .single();
  if (triggerError || !triggerMessage) {
    return json({ error: 'Trigger message not found' }, 404);
  }

  const { data: recentMessages, error: messagesError } = await admin
    .from('circle_messages')
    .select('id, sender_id, body, created_at, is_ai, ai_name')
    .eq('circle_id', circleId)
    .lte('created_at', triggerMessage.created_at)
    .order('created_at', { ascending: false })
    .limit(60);
  if (messagesError) {
    return json({ error: 'Could not load circle messages' }, 500);
  }

  const orderedMessages = [...(recentMessages ?? [])].reverse();
  const senderIds = Array.from(
    new Set(
      orderedMessages
        .map((message) => message.sender_id)
        .filter((senderId): senderId is string => typeof senderId === 'string' && senderId.length > 0),
    ),
  );

  const senderNames = new Map<string, string>();
  if (senderIds.length > 0) {
    const { data: profiles } = await admin
      .from('user_profiles')
      .select('user_id, nickname')
      .in('user_id', senderIds);

    for (const profile of profiles ?? []) {
      senderNames.set(profile.user_id, profile.nickname ?? 'Member');
    }
  }

  const promptMessages: CirclePromptMessage[] = orderedMessages.map((message) => ({
    senderName: message.is_ai ? message.ai_name ?? 'AI Companion' : senderNames.get(message.sender_id ?? '') ?? 'Member',
    body: message.body,
  }));
  const { conversation, omittedCount } = selectConversationWindow(promptMessages);
  const cleanedUserText = stripCompanionMention(triggerMessage.body) || triggerMessage.body;
  const prompt = buildCirclePrompt({
    circleTitle: circle.name,
    circleDescription: circle.description ?? undefined,
    circleTags: circle.category ? [circle.category] : undefined,
    safetyLevel: conversation.some((message) => /suicide|kill myself|end my life|hurt myself|self harm|overdose/i.test(message.body))
      ? 'heightened'
      : 'standard',
    omittedCount,
    conversation,
    userText: cleanedUserText,
  });

  const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openAiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.65,
      max_tokens: 260,
      messages: [
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!aiResponse.ok) {
    const errorText = await aiResponse.text();
    console.error('[circle-ai-companion] OpenAI error:', errorText);
    return json({ error: 'AI request failed' }, 502);
  }

  const aiJson = await aiResponse.json();
  const reply = aiJson.choices?.[0]?.message?.content?.trim();
  if (!reply) {
    return json({ error: 'AI returned an empty response' }, 502);
  }

  const { data: insertedMessage, error: insertError } = await admin
    .from('circle_messages')
    .insert({
      circle_id: circleId,
      sender_id: null,
      is_ai: true,
      ai_name: 'AI Companion',
      body: reply,
    })
    .select('id, circle_id, body, created_at, is_ai, ai_name')
    .single();

  if (insertError || !insertedMessage) {
    console.error('[circle-ai-companion] insert failed:', insertError?.message);
    return json({ error: 'Could not save AI reply' }, 500);
  }

  return json({
    message: {
      id: insertedMessage.id,
      circleId: insertedMessage.circle_id,
      senderId: 'ai-companion',
      senderNickname: insertedMessage.ai_name ?? 'AI Companion',
      isAI: true,
      body: insertedMessage.body,
      createdAt: insertedMessage.created_at,
    },
  });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
