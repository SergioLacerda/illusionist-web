import { describe, expect, it } from 'vitest';
import { withBase } from './paths';

// New in the ILUSIONISTA surface (documented in the migration report): the
// baseline concatenated `import.meta.env.BASE_URL` and a path, which only
// works when the base ends with a slash ("/providence/"). The deployment
// resolver normalizes the base without a trailing slash ("/providence"), so
// joining is done in one place that accepts both forms.

describe('withBase', () => {
  it.each([
    ['/providence/', 'detalhe-tecnico', '/providence/detalhe-tecnico'],
    ['/providence', 'detalhe-tecnico', '/providence/detalhe-tecnico'],
    ['/providence/', 'assets/sdd-mark.svg', '/providence/assets/sdd-mark.svg'],
    ['/providence', 'assets/sdd-mark.svg', '/providence/assets/sdd-mark.svg'],
    ['/', 'instalacao', '/instalacao'],
    ['/a/b', 'x', '/a/b/x'],
  ])('joins base %j and path %j to %j', (base, path, expected) => {
    expect(withBase(path, base)).toBe(expected);
  });

  it('ignores a leading slash in the path', () => {
    expect(withBase('/instalacao', '/providence')).toBe('/providence/instalacao');
  });

  it.each([
    ['/providence/', '/providence/'],
    ['/providence', '/providence/'],
    ['/', '/'],
  ])('returns the site root of base %j as %j', (base, expected) => {
    expect(withBase('', base)).toBe(expected);
  });
});
