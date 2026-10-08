import { describe, expect, it } from 'vitest';
import { resolveDeployment } from '../deployment';

describe('resolveDeployment', () => {
  it('is neutral when no deployment value is given', () => {
    expect(resolveDeployment({})).toEqual({ site: undefined, base: '/' });
  });

  it('treats blank values as unset', () => {
    expect(resolveDeployment({ ILLUSIONIST_SITE: '  ', ILLUSIONIST_BASE: '' })).toEqual({
      site: undefined,
      base: '/',
    });
  });

  it('reads site and base from the environment', () => {
    expect(
      resolveDeployment({
        ILLUSIONIST_SITE: 'https://example.org',
        ILLUSIONIST_BASE: '/docs',
      }),
    ).toEqual({ site: 'https://example.org', base: '/docs' });
  });

  it.each([
    ['docs', '/docs'],
    ['/docs/', '/docs'],
    ['/a/b/', '/a/b'],
    ['/', '/'],
  ])('normalizes base %j to %j', (input, expected) => {
    expect(resolveDeployment({ ILLUSIONIST_BASE: input }).base).toBe(expected);
  });

  it('rejects a site that is not an absolute http(s) URL', () => {
    expect(() => resolveDeployment({ ILLUSIONIST_SITE: 'example.org' })).toThrow(/ILLUSIONIST_SITE/);
    expect(() => resolveDeployment({ ILLUSIONIST_SITE: 'ftp://example.org' })).toThrow(
      /ILLUSIONIST_SITE/,
    );
  });

  it('rejects a base that is a URL or contains empty segments', () => {
    expect(() => resolveDeployment({ ILLUSIONIST_BASE: 'https://example.org/x' })).toThrow(
      /ILLUSIONIST_BASE/,
    );
    expect(() => resolveDeployment({ ILLUSIONIST_BASE: '/a//b' })).toThrow(/ILLUSIONIST_BASE/);
  });

  it('rejects a base mangled into a Windows path by a POSIX shell', () => {
    expect(() =>
      resolveDeployment({ ILLUSIONIST_BASE: 'C:/Program Files/Git/strategist-skill' }),
    ).toThrow(/ILLUSIONIST_BASE/);
  });
});
