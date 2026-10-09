// Structural gate for the Providence Selector output (dist/).
// The Selector is presentation only: the governed `data.json` and the optional
// `docs.index.json` are injected by the consumer at composition time, so they
// (and fixtures, governance files and sources) must never be in the output.
//
// Usage: node scripts/check-surface.mjs [dist-dir] [base-path]
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REQUIRED = ['index.html', 'site-header.css', 'site-header.js'];
// Forbidden as an entry name at any depth.
const FORBIDDEN_NAMES = ['data.json', 'docs.index.json'];
// Forbidden as a top-level entry.
const FORBIDDEN_TOP = [
  'fixtures',
  'compat',
  '.providence',
  'base_providence',
  'node_modules',
  'src',
  'scripts',
  'coverage',
  '.astro',
  'package.json',
  'package-lock.json',
];

function walk(dir, prefix = '') {
  const found = [];
  for (const name of readdirSync(dir)) {
    const rel = prefix ? `${prefix}/${name}` : name;
    found.push(rel);
    if (statSync(path.join(dir, name)).isDirectory()) found.push(...walk(path.join(dir, name), rel));
  }
  return found;
}

export function checkSurface(dist, base) {
  const problems = [];
  if (!/^\/[A-Za-z0-9._~-]+(\/[A-Za-z0-9._~-]+)*\/?$/.test(base)) {
    return [`invalid base ${JSON.stringify(base)}: expected a path such as "/providence/selector" (a POSIX shell may have rewritten it)`];
  }
  if (!existsSync(dist)) return [`output directory not found: ${dist}`];
  const entries = walk(dist);
  const top = new Set(entries.map((entry) => entry.split('/')[0]));

  for (const file of REQUIRED) {
    if (!existsSync(path.join(dist, file))) problems.push(`missing required file: ${file}`);
  }
  if (!entries.some((entry) => /^_astro\/.+\.js$/.test(entry))) problems.push('missing bundled JavaScript under _astro/');
  if (!entries.some((entry) => /^_astro\/.+\.css$/.test(entry))) problems.push('missing bundled CSS under _astro/');

  for (const entry of entries) {
    const name = entry.split('/').pop();
    if (FORBIDDEN_NAMES.includes(name)) problems.push(`forbidden entry present: ${entry} (governed data is injected by the consumer)`);
  }
  for (const name of FORBIDDEN_TOP) {
    if (top.has(name)) problems.push(`forbidden entry present: ${name}`);
  }

  const prefix = `${base.replace(/\/+$/, '')}/`;
  const reference = /(?:href|src)="(\/[^"]*)"/g;
  for (const entry of entries.filter((file) => file.endsWith('.html'))) {
    const html = readFileSync(path.join(dist, entry), 'utf-8');
    for (const match of html.matchAll(reference)) {
      const value = match[1];
      if (value.startsWith('//')) continue;
      if (value !== prefix.slice(0, -1) && !value.startsWith(prefix)) {
        problems.push(`${entry}: local reference outside ${prefix}: ${value}`);
      }
    }
  }
  return problems;
}

/**
 * @param {string[]} argv [dist-dir, base-path]
 * @param {Record<string, string | undefined>} env
 * @param {{ info: (message: string) => void, error: (message: string) => void }} [log]
 * @returns {number} process exit code
 */
export function runCli(argv, env, log = console) {
  const dist = path.resolve(argv[0] ?? 'dist');
  const base = argv[1] ?? env.ILLUSIONIST_BASE ?? '/providence/selector';
  const problems = checkSurface(dist, base);
  if (problems.length > 0) {
    for (const problem of problems) log.error(`[surface-gate] ${problem}`);
    return 1;
  }
  log.info(`[surface-gate] ${dist} passes the structural gate for ${base}`);
  return 0;
}

/* c8 ignore next 3 */
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(runCli(process.argv.slice(2), process.env));
}
