import { describe, expect, it } from 'vitest';
import { getLang, onLangChange, setLang } from './lang-bridge';

// Default (node) environment: there is no window, as during Astro's
// server-side rendering. The bridge must be inert and never throw.
describe('lang-bridge without a window', () => {
  it('getLang falls back to "pt"', () => {
    expect(getLang()).toBe('pt');
  });

  it('setLang does nothing', () => {
    expect(() => setLang('en')).not.toThrow();
  });

  it('onLangChange returns a no-op unsubscribe function', () => {
    const unsubscribe = onLangChange(() => {});
    expect(typeof unsubscribe).toBe('function');
    expect(() => unsubscribe()).not.toThrow();
  });
});
