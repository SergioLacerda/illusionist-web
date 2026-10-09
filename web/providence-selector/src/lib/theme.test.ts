// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import { resolveInitialTheme, THEME_KEY, toggleTheme } from './theme';

describe('resolveInitialTheme', () => {
  it.each([
    ['dark', false, 'dark'],
    ['light', true, 'light'],
    ['anything', true, 'light'],
    [null, true, 'dark'],
    [null, false, 'light'],
  ] as const)('stored %j with system dark=%j gives %s', (saved, prefersDark, expected) => {
    expect(resolveInitialTheme(saved, prefersDark)).toBe(expected);
  });
});

describe('toggleTheme', () => {
  beforeEach(() => document.documentElement.removeAttribute('data-theme'));

  it('switches light to dark and persists the choice', () => {
    const saved: Record<string, string> = {};
    document.documentElement.dataset.theme = 'light';
    expect(toggleTheme(document, { setItem: (k, v) => void (saved[k] = v) })).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(saved[THEME_KEY]).toBe('dark');
  });

  it('switches dark to light', () => {
    document.documentElement.dataset.theme = 'dark';
    expect(toggleTheme(document, { setItem: () => {} })).toBe('light');
  });

  it('treats an unset theme as light and goes dark', () => {
    expect(toggleTheme(document, { setItem: () => {} })).toBe('dark');
  });
});
