import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { checkSurface, runCli } from './check-surface.mjs';

const BASE = '/providence';
const roots: string[] = [];

function put(root: string, file: string, content = ''): void {
  const target = path.join(root, file);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, content);
}

function surface(overrides: Record<string, string | null> = {}): string {
  const root = mkdtempSync(path.join(tmpdir(), 'surface-'));
  roots.push(root);
  const files: Record<string, string | null> = {
    'index.html': '<a href="/providence/instalacao"></a><link href="/providence/_astro/a.css">',
    'detalhe-tecnico/index.html': '<a href="/providence/"></a>',
    'instalacao/index.html': '<a href="/providence/"></a>',
    '_astro/a.css': 'body{}',
    'assets/sdd-mark.svg': '<svg/>',
    'assets/sdd-wordmark.svg': '<svg/>',
    'shared/site-header.js': '//',
    'shared/site-header.css': '/**/',
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
  it('accepts a complete surface', () => {
    expect(checkSurface(surface(), BASE)).toEqual([]);
  });

  it('reports missing routes and assets', () => {
    const problems = checkSurface(
      surface({ 'index.html': null, 'detalhe-tecnico/index.html': null, 'assets/sdd-mark.svg': null }),
      BASE,
    );
    expect(problems.join('\n')).toMatch(/index\.html/);
    expect(problems.join('\n')).toMatch(/detalhe-tecnico/);
    expect(problems.join('\n')).toMatch(/assets\/sdd-mark\.svg/);
  });

  it.each(['docs/index.html', 'selector/index.html'])('rejects the reserved namespace entry %s', (file) => {
    const problems = checkSurface(surface({ [file]: '<html/>' }), BASE);
    expect(problems.join('\n')).toMatch(/reserved/);
  });

  it.each(['node_modules/x/index.js', 'base_providence/a.txt', 'src/pages/index.astro', 'package.json'])(
    'rejects source-only entry %s',
    (file) => {
      expect(checkSurface(surface({ [file]: 'x' }), BASE).join('\n')).toMatch(/not publishable/);
    },
  );

  it('rejects local references that leave the base path', () => {
    const problems = checkSurface(
      surface({ 'index.html': '<a href="/strategist-skill/x"></a><img src="/rpg-system-rgb/y.png">' }),
      BASE,
    );
    expect(problems.join('\n')).toMatch(/\/strategist-skill\/x/);
    expect(problems.join('\n')).toMatch(/\/rpg-system-rgb\/y\.png/);
  });

  it('ignores external and relative references', () => {
    const html = '<a href="https://github.com/x"></a><a href="#"></a><a href="relative.html"></a>';
    expect(checkSurface(surface({ 'index.html': html }), BASE)).toEqual([]);
  });
});

describe('checkSurface — base path validation', () => {
  it.each(['C:/Program Files/Git/providence', 'providence', 'https://x.org/providence', ''])(
    'rejects the invalid base %j',
    (base) => {
      expect(checkSurface(surface(), base).join('\n')).toMatch(/invalid base/);
    },
  );
});

describe('runCli', () => {
  const quiet = { info: () => {}, error: () => {} };

  it('exits 0 for a complete surface', () => {
    expect(runCli([surface(), BASE], {}, quiet)).toBe(0);
  });

  it('exits 1 and reports every problem for a broken surface', () => {
    const errors: string[] = [];
    const code = runCli([surface({ 'docs/index.html': 'x' }), BASE], {}, { ...quiet, error: (m: string) => errors.push(m) });
    expect(code).toBe(1);
    expect(errors.join('\n')).toMatch(/reserved/);
  });

  it('takes the base from ILLUSIONIST_BASE when no argument is given', () => {
    expect(runCli([surface()], { ILLUSIONIST_BASE: '/providence' }, quiet)).toBe(0);
  });
});
