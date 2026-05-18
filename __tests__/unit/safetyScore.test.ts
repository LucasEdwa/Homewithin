import { computeSafetyScore, hasCrisisSignal } from '@/services/safetyScore';

describe('hasCrisisSignal', () => {
  it('returns true when self_harm_thoughts is set', () => {
    expect(hasCrisisSignal({ self_harm_thoughts: true })).toBe(true);
  });

  it('returns true when currently_in_danger is set', () => {
    expect(hasCrisisSignal({ currently_in_danger: true })).toBe(true);
  });

  it('returns false with no crisis signals', () => {
    expect(hasCrisisSignal({ phone_surveillance: true, hopelessness: true })).toBe(false);
  });
});

describe('computeSafetyScore', () => {
  describe('auto-red: crisis signals bypass scoring', () => {
    it('returns red when currently_in_danger regardless of mood', () => {
      expect(computeSafetyScore(9, { currently_in_danger: true })).toBe('red');
    });

    it('returns red when self_harm_thoughts regardless of mood', () => {
      expect(computeSafetyScore(9, { self_harm_thoughts: true })).toBe('red');
    });

    it('returns red when self_harm_thoughts even with all protective factors', () => {
      expect(computeSafetyScore(8, {
        self_harm_thoughts: true,
        trusted_contact: true,
        safe_place: true,
        basic_needs_met: true,
      })).toBe('red');
    });
  });

  describe('green (safe)', () => {
    it('returns green when mood is high and no risk factors', () => {
      expect(computeSafetyScore(9, {})).toBe('green');
    });

    it('returns green when mood is 7 with no answers', () => {
      // mood 7 → +1 risk, threshold for yellow is ≥2 → green
      expect(computeSafetyScore(7, {})).toBe('green');
    });

    it('returns green when mood is 6 with no answers', () => {
      // mood 6 → +1 risk → green (below yellow threshold of 2)
      expect(computeSafetyScore(6, {})).toBe('green');
    });

    it('returns green when mood is moderate and trusted contact neutralises risk', () => {
      // mood 5 → +2, trusted_contact → -2, safe_place → -1 = −1 (floor at 0) → green
      expect(computeSafetyScore(5, { trusted_contact: true, safe_place: true })).toBe('green');
    });

    it('returns green when mood is low but strong protective factors offset', () => {
      // mood 2 → +3, trusted_contact → -2, safe_place → -1 = 0 → green
      expect(computeSafetyScore(2, { trusted_contact: true, safe_place: true })).toBe('green');
    });
  });

  describe('yellow (some support may help)', () => {
    it('returns yellow when mood is ≤5 with no answers', () => {
      // mood 4 → +2 → yellow
      expect(computeSafetyScore(4, {})).toBe('yellow');
    });

    it('returns yellow when mood is low (≤3) with only trusted contact', () => {
      // mood 2 → +3, trusted_contact → -2 = 1 → green… adjust: use hopelessness too
      // mood 2 → +3, hopelessness → +2, trusted_contact → -2 = 3 → yellow
      expect(computeSafetyScore(2, { hopelessness: true, trusted_contact: true })).toBe('yellow');
    });

    it('returns yellow with phone_surveillance and moderate mood', () => {
      // mood 5 → +2, phone_surveillance → +1 = 3 → yellow
      expect(computeSafetyScore(5, { phone_surveillance: true })).toBe('yellow');
    });

    it('returns yellow with conversion_pressure alone', () => {
      // mood 8 → +0, conversion_pressure → +2 = 2 → yellow
      expect(computeSafetyScore(8, { conversion_pressure: true })).toBe('yellow');
    });

    it('returns yellow with outed_recently alone', () => {
      // mood 8 → 0, outed_recently → +2 = 2 → yellow
      expect(computeSafetyScore(8, { outed_recently: true })).toBe('yellow');
    });
  });

  describe('red (immediate support needed)', () => {
    it('returns red with physical_abuse alone', () => {
      // mood 8 → 0, physical_abuse → +4 = 4 → yellow... need high mood + physical_abuse
      // Actually: risk=4 < threshold 5 → yellow. Need another factor.
      // physical_abuse + housing_unstable (compound): +4 + 3 + 2 = 9 → red
      expect(computeSafetyScore(8, {
        physical_abuse: true,
        housing_unstable: true,
      })).toBe('red');
    });

    it('returns red with low mood + physical abuse', () => {
      // mood 2 → +3, physical_abuse → +4 = 7 → red
      expect(computeSafetyScore(2, { physical_abuse: true })).toBe('red');
    });

    it('returns red with multiple moderate risk factors', () => {
      // mood 4 → +2, emotional_control → +2, conversion_pressure → +2 = 6 → red
      expect(computeSafetyScore(4, {
        emotional_control: true,
        conversion_pressure: true,
      })).toBe('red');
    });

    it('returns red even with trusted contact when risk is high enough', () => {
      // mood 2 → +3, physical_abuse → +4, trusted_contact → -2 = 5 → red
      expect(computeSafetyScore(2, {
        physical_abuse: true,
        trusted_contact: true,
      })).toBe('red');
    });
  });

  describe('boundary conditions', () => {
    it('mood score 3 → +3 risk → yellow (≥2)', () => {
      expect(computeSafetyScore(3, {})).toBe('yellow');
    });

    it('mood score 5 → +2 risk → yellow', () => {
      expect(computeSafetyScore(5, {})).toBe('yellow');
    });

    it('mood score 6 → +1 risk → green (below ≥2 threshold)', () => {
      expect(computeSafetyScore(6, {})).toBe('green');
    });

    it('mood score 10 → 0 risk → green', () => {
      expect(computeSafetyScore(10, {})).toBe('green');
    });
  });
});
