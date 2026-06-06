export type CirclePromptMessage = {
  senderName: string;
  body: string;
};

export type CirclePromptInput = {
  circleTitle: string;
  circleDescription?: string;
  circleTags?: string[];
  safetyLevel: 'standard' | 'heightened';
  omittedCount: number;
  conversation: CirclePromptMessage[];
  userText: string;
};

const CIRCLE_SYSTEM_PROMPT = `You are AI Companion inside a Homewithin support circle.

Your role:
- Be warm, grounding, and supportive
- Stay relevant to the circle theme and current discussion
- Offer reflection, coping ideas, and gentle next steps when useful
- Address the group when appropriate, but answer the member who mentioned you

What you are NOT:
- A therapist, doctor, moderator, or crisis responder
- A source of medical or psychiatric advice
- A replacement for emergency or professional support

Safety:
- If the conversation includes suicide, self-harm, or immediate danger, tell the user to contact crisis support immediately
- Do not give instructions for harm, concealment, or retaliation
- Avoid exposing one member's private details to the group

Style:
- Warm, concise, direct
- Keep responses under 180 words
- Ask at most one gentle follow-up question`;

export function stripCompanionMention(text: string): string {
  return text.replace(/(^|\s)@companion\b/gi, ' ').replace(/\s+/g, ' ').trim();
}

export function selectConversationWindow(
  messages: CirclePromptMessage[],
  maxMessages = 24,
  maxChars = 4000,
): { conversation: CirclePromptMessage[]; omittedCount: number } {
  const selected: CirclePromptMessage[] = [];
  let totalChars = 0;

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    const messageChars = message.senderName.length + message.body.length + 6;
    const wouldExceedCount = selected.length >= maxMessages;
    const wouldExceedChars = selected.length > 0 && totalChars + messageChars > maxChars;

    if (wouldExceedCount || wouldExceedChars) {
      break;
    }

    selected.push(message);
    totalChars += messageChars;
  }

  selected.reverse();
  return {
    conversation: selected,
    omittedCount: Math.max(0, messages.length - selected.length),
  };
}

export function buildCirclePrompt(input: CirclePromptInput): string {
  const contextLines = [
    `Circle title: ${input.circleTitle}`,
    input.circleDescription ? `Circle description: ${input.circleDescription}` : null,
    input.circleTags?.length ? `Circle tags: ${input.circleTags.join(', ')}` : null,
    `Safety mode: ${input.safetyLevel}`,
    input.omittedCount > 0
      ? `Earlier context omitted from prompt: ${input.omittedCount} older message${input.omittedCount === 1 ? '' : 's'}. Focus on the most recent discussion.`
      : null,
  ].filter(Boolean);

  const transcript = input.conversation.length > 0
    ? input.conversation.map((message) => `[${message.senderName}] ${message.body}`).join('\n')
    : 'No prior circle messages.';

  return `${CIRCLE_SYSTEM_PROMPT}

--- CIRCLE CONTEXT ---
${contextLines.join('\n')}

--- RECENT GROUP CONVERSATION ---
${transcript}

--- CURRENT REQUEST ---
${input.userText}`;
}
