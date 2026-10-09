import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { checkSurface, runCli } from './check-surface.mjs';

const BASE = '/providence/selector';
const roots: string[] = [];

function put(root: string, file: string, content = ''): void {
  const target = path.join(root, file);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, content);
}

function surface(overrides: Record<string, string | null> = {}): string {
  const root = mkdtempSync(path.join(tmpdir(), 'selector-'));
  roots.push(root);
  const files: Record<string, string | null> = {
    'index.html':
      '<link rel="stylesheet" href="/providence/selector/_astro/a.css"><link href="site-header.css"><script src="site-header.js"></script>',
    '_astro/a.css': 'body{}',
    '_astro/a.js': '//',
    'site-header.css': '/**/',
    'site-header.js': '//',
    ...overrides,
  };
  for (const [file, content] of Object.entries(files)) {
    if (content !== null) put(root, file, content);
  }
  return root;
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('checkSurface', () => {
  it('accepts a complete presentation-only surface', () => {
    expect(checkSurface(surface(), BASE)).toEqual([]);
  });

  it('reports missing required files and missing bundled assets', () => {
    const text = checkSurface(
      surface({ 'index.html': null, 'site-header.js': null, '_astro/a.js': null, '_astro/a.css': null }),
      BASE,
    ).join('\n');
    expect(text).toMatch(/index\.html/);
    expect(text).toMatch(/site-header\.js/);
    expect(text).toMatch(/bundled JavaScript/);
    expect(text).toMatch(/bundled CSS/);
  });

  it.each([
    'data.json',
    'docs.index.json',
    'nested/data.json',
    'fixtures/data.json',
    'compat/providence-7bbfb67/data.json',
    '.providence/metadata.json',
    'base_providence/x.txt',
    'node_modules/x/index.js',
    'src/pages/index.astro',
    'scripts/check-surface.mjs',
    'package.json',
    'coverage/index.html',
  ])('rejects the forbidden entry %s', (file) => {
    expect(checkSurface(surface({ [file]: 'x' }), BASE).join('\n')).toMatch(/forbidden/);
  });

  it('rejects local references that leave the base path', () => {
    const html = '<a href="/providence/docs/x"></a><img src="/rpg-system-rgb/y.png">';
    const text = checkSurface(surface({ 'index.html': html }), BASE).join('\n');
    expect(text).toMatch(/\/providence\/docs\/x/);
    expect(text).toMatch(/\/rpg-system-rgb\/y\.png/);
  });

  it('ignores external, relative and protocol-relative references', () => {
    const html = '<a href="https://x.org"></a><a href="#"></a><a href="site-header.css"></a><a href="//cdn.example/x"></a>';
    expect(checkSurface(surface({ 'index.html': html }), BASE)).toEqual([]);
  });

  it('accepts the base itself as a reference', () => {
    expect(checkSurface(surface({ 'index.html': '<a href="/providence/selector"></a>' + '<link href="/providence/selector/_astro/a.css">' }), BASE)).toEqual([]);
  });

  it.each(['C:/Program Files/Git/providence/selector', 'providence', 'https://x.org/p', ''])(
    'rejects the invalid base %j',
    (base) => {
      expect(checkSurface(surface(), base).join('\n')).toMatch(/invalid base/);
    },
  );

  it('reports a missing output directory', () => {
    expect(checkSurface(path.join(tmpdir(), 'does-not-exist-selector'), BASE).join('\n')).toMatch(/not found/);
  });
});

describe('runCli', () => {
  const quiet = { info: () => {}, error: () => {} };

  it('exits 0 for a complete surface', () => {
    expect(runCli([surface(), BASE], {}, quiet)).toBe(0);
  });

  it('exits 1 and reports the problems for a broken surface', () => {
    const errors: string[] = [];
    const code = runCli([surface({ 'data.json': '{}' }), BASE], {}, { ...quiet, error: (m: string) => errors.push(m) });
    expect(code).toBe(1);
    expect(errors.join('\n')).toMatch(/forbidden/);
  });

  it('takes the base from ILLUSIONIST_BASE when no argument is given', () => {
    expect(runCli([surface()], { ILLUSIONIST_BASE: BASE }, quiet)).toBe(0);
  });
});
