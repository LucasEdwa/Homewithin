# Plan: AI Companion Inside Support Circles

Date: 2026-06-05
Owner: Homewithin product + engineering
Status: Draft

## 1) Objective

Enable the AI Companion inside each Support Circle so it can:
- Read the circle title/theme.
- Understand the circle context.
- Talk to circle members in a way that stays on-topic and supportive.

Example:
- Circle title: "Anxiety & Panic Support"
- AI behavior: Responds with anxiety-focused coping guidance, reflection prompts, and resource suggestions.

## 2) Scope

In scope:
- AI can access circle metadata (title + optional short description/tags).
- AI prompt is dynamically contextualized per circle.
- AI is available in group chat as a participant/bot.
- Safety and moderation guardrails for mental health context.
- Basic analytics and phased rollout.

Out of scope (phase 1):
- AI reading private DMs to infer circle context.
- Long-term memory of sensitive personal user details.
- Clinical diagnosis or emergency handling beyond escalation guidance.

## 3) Product Requirements

1. Circle-context awareness
- AI must ingest the active circle title on each message.
- If available, include circle description and tags.

2. On-topic behavior
- AI should prioritize responses connected to the circle theme.
- If user asks unrelated questions, AI should gently redirect back to circle purpose.

3. Supportive tone
- Non-judgmental, empathetic, concise, practical.
- No medical diagnosis; no certainty claims about clinical outcomes.

4. Safety behavior
- Detect self-harm/violence/high-risk intent.
- Provide crisis guidance and hotline escalation path.
- Trigger moderation event logging for high-risk messages.

5. Consent and disclosure
- Users must explicitly agree before using AI inside a Support Circle chat.
- The chat must clearly disclose that messages sent to the AI may be processed by an AI provider and may be reviewed for safety/moderation according to policy.
- Agreement should be captured per user before first AI interaction and re-requested if terms materially change.

6. Group-aware interaction
- Address the group when appropriate (not only one user).
- Avoid exposing one member's private data to others.

## 4) UX Flow

1. User opens a Support Circle chat.
2. System loads circle context (title, description, tags).
3. If the user has not yet accepted the AI chat agreement, show a consent sheet before allowing AI interaction.
4. When AI is mentioned (or AI mode is active), request is sent with:
- Current message
- Last N messages from that circle chat
- Circle context block
- Safety policy block
- Consent/agreement status
5. AI response appears in-thread as "AI Companion".
6. If message is high-risk, app injects safety card + emergency resources.

## 5) Technical Design

## 5.1 Context model

Create a normalized context object passed to the AI service:

```ts
interface CircleAIContext {
  circleId: string;
  circleTitle: string;
  circleDescription?: string;
  circleTags?: string[];
  language?: string;
  region?: string;
  safetyLevel: 'standard' | 'heightened';
}
```

## 5.2 Prompt construction

Compose prompt in layers:
- System policy: safety + boundaries + role.
- App policy: tone guidelines for Homewithin.
- Circle context: title/theme and what support focus means.
- Conversation window: last N group messages.
- User message.

Prompt rule example:
- "You are assisting in a support circle called {circleTitle}. Keep guidance relevant to this theme unless asked to switch. If unrelated, answer briefly and reconnect to the circle goal."

## 5.3 Backend integration

Recommended path:
- Add a server-side AI orchestration endpoint/function (do not build prompt entirely on device).
- Endpoint responsibilities:
- Validate auth and circle membership.
- Fetch circle metadata.
- Build prompt with safety templates.
- Call LLM provider.
- Run output safety checks.
- Return structured response + optional safety actions.

## 5.4 Data and permissions

- Ensure user can only invoke AI for circles they belong to.
- Store agreement acceptance metadata such as user ID, timestamp, policy version, and circle context if needed for auditability.
- Log minimal required telemetry (no raw sensitive logs unless policy allows).
- Redact or hash identifiers in AI logs where possible.

## 6) Safety and Policy Guardrails

Input checks:
- Self-harm, harm to others, abuse, crisis indicators.
- Prompt injection attempts ("ignore previous instructions").

Output checks:
- Remove harmful or prescriptive medical claims.
- Enforce supportive and non-triggering language.
- Attach resource panel when risk level >= threshold.

Escalation:
- If imminent risk detected, show emergency message and local hotline resources.
- Optionally notify moderators depending on policy settings.

## 7) Implementation Plan (Phased)

Phase 1: Foundation (1 sprint)
- Define `CircleAIContext` contract.
- Add circle metadata fetch in AI request pipeline.
- Create prompt templates with circle theme injection.
- Add unit tests for prompt builder.

Phase 2: Group Chat Integration (1 sprint)
- Add AI participant behavior in circle chat UI.
- Mention trigger (`@companion`) or explicit "Ask AI" action.
- Add first-use agreement modal/sheet and persistent disclosure in chat UI.
- Add loading/error states and retry UX.

Phase 3: Safety + Moderation (1 sprint)
- Implement input/output safety filters.
- Add crisis response cards/resources.
- Add moderation event hooks and audit logs.

Phase 4: Rollout + Optimization (1 sprint)
- Gradual rollout by percentage or selected circles.
- Track metrics and collect qualitative feedback.
- Tune prompts by circle category.

## 8) Testing Strategy

Unit tests:
- Prompt includes circle title every request.
- Prompt fallback when description/tags missing.
- Redirection behavior for off-topic prompts.

Integration tests:
- Member can call AI in own circle.
- Non-member cannot access circle AI context.
- User cannot invoke AI until agreement is accepted.
- Agreement is re-requested when policy version changes.
- High-risk input triggers safety response path.

Manual QA scenarios:
- Anxiety circle, grief circle, parenting circle themes.
- Mixed-language circle titles.
- Adversarial prompt injection attempts.

## 9) Success Metrics

Primary:
- % AI responses rated "helpful" in circle context.
- Reduction in off-topic AI responses.
- Safety policy compliance rate.

Secondary:
- AI engagement per active circle.
- Retry/failure rate for AI responses.
- Moderator interventions after AI responses.

## 10) Open Questions

- Should AI respond automatically or only on mention?
Only when on mention, if it has more then 1 user.

- Should each circle have configurable AI tone/style?
yes, each circle will have a tone/style.

- What level of conversation history should be included by default?
it will reason all the conversation when mentioned and then responde related to the question

- What should the AI agreement say inside the chat?
It should explain that the user is talking to AI inside a group support circle, that messages may be processed for response generation and safety monitoring, that the AI is not a licensed therapist or emergency service, and that crisis situations may trigger resource guidance or moderation flows.

- What are legal/compliance constraints by region?
Need product/legal review for consent language, retention, regional privacy rules, and whether explicit opt-in wording must vary by country.

## 11) Definition of Done

- AI companion can respond inside support circles with theme-aware context.
- Safety checks are active for both input and output.
- Access control and audit logging are in place.
- AI agreement/disclosure is required before first use and versioned for future policy updates.
- Tests pass and rollout flag is available.
