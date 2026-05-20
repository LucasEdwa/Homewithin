import { CRISIS_HOTLINES, getHotlinesForCountry } from '@/data/hotlines';

describe('CRISIS_HOTLINES', () => {
  it('contains at least 10 countries', () => {
    expect(CRISIS_HOTLINES.length).toBeGreaterThanOrEqual(10);
  });

  it('every country entry has a name, code, and at least one hotline', () => {
    for (const entry of CRISIS_HOTLINES) {
      expect(entry.country).toBeTruthy();
      expect(entry.code).toMatch(/^[A-Z]{2}$/);
      expect(entry.hotlines.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('every hotline has a name and number', () => {
    for (const entry of CRISIS_HOTLINES) {
      for (const hotline of entry.hotlines) {
        expect(hotline.name).toBeTruthy();
        expect(hotline.number).toBeTruthy();
      }
    }
  });

  it('includes English-speaking countries (US, UK, AU, CA)', () => {
    const codes = CRISIS_HOTLINES.map((c) => c.code);
    expect(codes).toContain('US');
    expect(codes).toContain('GB');
    expect(codes).toContain('AU');
    expect(codes).toContain('CA');
  });

  it('includes Brazil and Portugal for Portuguese speakers', () => {
    const codes = CRISIS_HOTLINES.map((c) => c.code);
    expect(codes).toContain('BR');
    expect(codes).toContain('PT');
  });
});

describe('getHotlinesForCountry', () => {
  it('finds by full country name (case-insensitive)', () => {
    const result = getHotlinesForCountry('united states');
    expect(result).toBeDefined();
    expect(result?.code).toBe('US');
  });

  it('finds by country code (case-insensitive)', () => {
    const result = getHotlinesForCountry('br');
    expect(result).toBeDefined();
    expect(result?.country).toBe('Brazil');
  });

  it('returns undefined for an unknown country', () => {
    const result = getHotlinesForCountry('Wakanda');
    expect(result).toBeUndefined();
  });

  it('finds Australia', () => {
    const result = getHotlinesForCountry('Australia');
    expect(result).toBeDefined();
    expect(result!.hotlines.length).toBeGreaterThan(0);
  });

  it('found hotlines contain callable numbers', () => {
    const result = getHotlinesForCountry('US');
    expect(result).toBeDefined();
    expect(result!.hotlines.some((h) => h.number.includes('866'))).toBe(true);
  });
});
