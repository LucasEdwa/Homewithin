import {
  buildCirclePrompt,
  selectConversationWindow,
  stripCompanionMention,
} from '../../supabase/functions/_shared/circle-ai';

describe('circle AI windowing', () => {
  it('strips the companion mention from the user request', () => {
    expect(stripCompanionMention('@companion can you help us?')).toBe('can you help us?');
  });

  it('keeps the most recent messages inside the configured window', () => {
    const messages = Array.from({ length: 8 }, (_, index) => ({
      senderName: `Member ${index + 1}`,
      body: `Message ${index + 1}`,
    }));

    const result = selectConversationWindow(messages, 3, 1000);

    expect(result.conversation).toEqual([
      { senderName: 'Member 6', body: 'Message 6' },
      { senderName: 'Member 7', body: 'Message 7' },
      { senderName: 'Member 8', body: 'Message 8' },
    ]);
    expect(result.omittedCount).toBe(5);
  });

  it('adds an omitted-context note to the generated prompt', () => {
    const prompt = buildCirclePrompt({
      circleTitle: 'Anxiety Support',
      safetyLevel: 'standard',
      omittedCount: 4,
      conversation: [{ senderName: 'Taylor', body: 'I am feeling overwhelmed tonight.' }],
      userText: 'How can I settle down?',
    });

    expect(prompt).toContain('Earlier context omitted from prompt: 4 older messages.');
    expect(prompt).toContain('[Taylor] I am feeling overwhelmed tonight.');
    expect(prompt).toContain('How can I settle down?');
  });
});
