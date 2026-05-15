import { containsCrisisKeywords } from '@/services/chat';

describe('containsCrisisKeywords', () => {
  it('returns false for normal text', () => {
    expect(containsCrisisKeywords('Hey, how are you doing today?')).toBe(false);
    expect(containsCrisisKeywords('I feel sad but I am okay')).toBe(false);
    expect(containsCrisisKeywords('')).toBe(false);
  });

  it('detects "suicide"', () => {
    expect(containsCrisisKeywords('I am thinking about suicide')).toBe(true);
  });

  it('detects "kill myself"', () => {
    expect(containsCrisisKeywords('I want to kill myself')).toBe(true);
  });

  it('detects "end my life"', () => {
    expect(containsCrisisKeywords('I want to end my life')).toBe(true);
  });

  it('detects "hurt myself"', () => {
    expect(containsCrisisKeywords('I keep wanting to hurt myself')).toBe(true);
  });

  it('detects "self harm"', () => {
    expect(containsCrisisKeywords('I am doing self harm')).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(containsCrisisKeywords('SUICIDE is on my mind')).toBe(true);
    expect(containsCrisisKeywords('WANT TO DIE')).toBe(true);
  });

  it('detects "no reason to live"', () => {
    expect(containsCrisisKeywords('I see no reason to live anymore')).toBe(true);
  });
});
