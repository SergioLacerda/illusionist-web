import { describe, expect, it } from 'vitest';
import { langFromSearch, STRINGS, type Strings } from './strings';

describe('STRINGS', () => {
  it('has the same keys in both languages', () => {
    expect(Object.keys(STRINGS.pt).sort()).toEqual(Object.keys(STRINGS.en).sort());
  });

  it.each(['en', 'pt'] as const)('every message in %s is a non-empty text', (lang) => {
    const strings = STRINGS[lang] as unknown as Record<string, unknown>;
    for (const [key, value] of Object.entries(strings)) {
      const text = typeof value === 'function' ? (value as (...args: unknown[]) => string)('A', 'B') : value;
      expect(typeof text, key).toBe('string');
      expect((text as string).length, key).toBeGreaterThan(0);
    }
  });

  it('puts the arguments into the parameterized messages', () => {
    const en: Strings = STRINGS.en;
    expect(en.selected(3)).toContain('3');
    expect(en.depends('M001')).toContain('M001');
    expect(en.warnRequires('A', 'B')).toContain('A');
    expect(en.warnRequires('A', 'B')).toContain('B');
    expect(STRINGS.pt.errUnknownId('ZZZ')).toContain('ZZZ');
  });
});

describe('langFromSearch', () => {
  it.each([
    ['?lang=pt', 'pt'],
    ['?lang=en', 'en'],
    ['?lang=fr', 'en'],
    ['', 'en'],
  ] as const)('reads %j as %s', (search, expected) => {
    expect(langFromSearch(search)).toBe(expected);
  });
});
