import { filterContent } from '@/services/social/contentFilter';

describe('filterContent — safe messages', () => {
  it('passes normal chat text', () => {
    expect(filterContent('Hey, how are you doing today?').ok).toBe(true);
    expect(filterContent('I feel sad but I am okay').ok).toBe(true);
    expect(filterContent('').ok).toBe(true);
    expect(filterContent('Hello everyone in the circle!').ok).toBe(true);
  });

  it('does not block "fag" as part of an unrelated word', () => {
    // Ensure word-boundary anchors prevent false positives on fragments
    expect(filterContent('stagnant').ok).toBe(true);
  });
});

describe('filterContent — LGBTQ+ slurs (blocked)', () => {
  it('blocks homophobic slur (lowercase)', () => {
    const result = filterContent('you are such a faggot');
    expect(result.ok).toBe(false);
    expect((result as any).reason).toMatch(/community guidelines/i);
  });

  it('blocks homophobic slur (uppercase)', () => {
    expect(filterContent('FAGGOT').ok).toBe(false);
  });

  it('blocks transphobic slur', () => {
    expect(filterContent('you tranny').ok).toBe(false);
  });

  it('blocks another transphobic slur', () => {
    expect(filterContent('shemale content').ok).toBe(false);
  });
});

describe('filterContent — racial slurs (blocked)', () => {
  it('blocks n-slur (er suffix)', () => {
    expect(filterContent('you nigger').ok).toBe(false);
  });

  it('blocks n-slur (a suffix)', () => {
    expect(filterContent('nigga').ok).toBe(false);
  });
});

describe('filterContent — explicit threats (blocked)', () => {
  it('blocks direct violence threat', () => {
    expect(filterContent("i'll kill you").ok).toBe(false);
  });

  it('blocks another threat variant', () => {
    expect(filterContent('I will rape you').ok).toBe(false);
  });
});

describe('filterContent — illegal content (blocked)', () => {
  it('blocks CSAM reference', () => {
    expect(filterContent('child porn link').ok).toBe(false);
  });

  it('blocks child exploitation reference', () => {
    expect(filterContent('child sex abuse').ok).toBe(false);
  });
});
