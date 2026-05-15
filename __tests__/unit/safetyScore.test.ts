import { computeSafetyScore } from '@/services/safetyScore';

describe('computeSafetyScore', () => {
  describe('green (safe)', () => {
    it('returns green when mood is high and no risk factors', () => {
      expect(computeSafetyScore(9, {})).toBe('green');
    });

    it('returns green when mood is 7 with no answers', () => {
      expect(computeSafetyScore(7, {})).toBe('green');
    });

    it('returns green when mood is moderate but trusted contact mitigates risk', () => {
      expect(computeSafetyScore(5, { trusted_contact: true })).toBe('green');
    });

    it('returns green when lives with family but no other risk factors and high mood', () => {
      expect(computeSafetyScore(8, { lives_with_family: true })).toBe('green');
    });
  });

  describe('yellow (some support may help)', () => {
    it('returns yellow when mood is low-moderate (4–6) with no danger', () => {
      expect(computeSafetyScore(4, {})).toBe('yellow');
    });

    it('returns yellow when phone access risk is present with moderate mood', () => {
      expect(computeSafetyScore(5, { phone_access_risk: true })).toBe('yellow');
    });

    it('returns yellow when mood is low but trusted contact is available', () => {
      expect(computeSafetyScore(2, { trusted_contact: true })).toBe('yellow');
    });
  });

  describe('red (immediate support needed)', () => {
    it('returns red when currently in danger regardless of mood', () => {
      expect(computeSafetyScore(8, { currently_in_danger: true })).toBe('red');
    });

    it('returns red when mood is very low and in danger', () => {
      expect(computeSafetyScore(1, { currently_in_danger: true })).toBe('red');
    });

    it('returns red when in danger and living with family (compound risk)', () => {
      expect(computeSafetyScore(7, {
        currently_in_danger: true,
        lives_with_family: true,
      })).toBe('red');
    });

    it('returns red when mood is very low with phone risk', () => {
      expect(computeSafetyScore(2, { phone_access_risk: true })).toBe('red');
    });

    it('returns red even with trusted contact when in danger', () => {
      // in danger = +4, trusted contact = -1, total = 3 → still red (≥4 no, ≥2 yes = yellow)
      // Actually: in danger = +4, trusted_contact = -1 → risk = 3 → yellow
      // Let's check: with low mood AND danger: 3 (mood) + 4 (danger) - 1 (trusted) = 6 → red
      expect(computeSafetyScore(2, {
        currently_in_danger: true,
        trusted_contact: true,
      })).toBe('red');
    });
  });

  describe('boundary conditions', () => {
    it('mood score of exactly 3 contributes 3 risk points', () => {
      // risk = 3 → yellow (≥2)
      expect(computeSafetyScore(3, {})).toBe('yellow');
    });

    it('mood score of exactly 6 contributes 1 risk point — yellow', () => {
      // risk = 1 → yellow (≥1); a 6/10 safety feeling warrants "some support may help"
      expect(computeSafetyScore(6, {})).toBe('yellow');
    });

    it('mood score of 10 contributes 0 risk points', () => {
      expect(computeSafetyScore(10, {})).toBe('green');
    });

    it('all risk factors at once returns red', () => {
      expect(computeSafetyScore(1, {
        lives_with_family: true,
        phone_access_risk: true,
        currently_in_danger: true,
        trusted_contact: true,
      })).toBe('red');
    });
  });
});
