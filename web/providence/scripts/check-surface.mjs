// Structural gate for the Providence surface output (dist/).
// The surface is the presentation root only: /docs/ and /selector/ belong to
// the consumer (MkDocs and the Selector compiler), so they must be absent.
//
// Usage: node scripts/check-surface.mjs [dist-dir] [base-path]
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REQUIRED = [
  'index.html',
  'detalhe-tecnico/index.html',
  'instalacao/index.html',
  'assets/sdd-mark.svg',
  'assets/sdd-wordmark.svg',
  'shared/site-header.css',
  'shared/site-header.js',
];
const RESERVED = ['docs', 'selector'];
const NOT_PUBLISHABLE = ['node_modules', 'base_providence', 'src', 'scripts', 'coverage', '.astro', 'package.json', 'package-lock.json'];

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
    return [`invalid base ${JSON.stringify(base)}: expected a path such as "/providence" (a POSIX shell may have rewritten it)`];
  }
  if (!existsSync(dist)) return [`output directory not found: ${dist}`];
  const entries = walk(dist);
  const top = new Set(entries.map((entry) => entry.split('/')[0]));

  for (const file of REQUIRED) {
    if (!existsSync(path.join(dist, file))) problems.push(`missing required file: ${file}`);
  }
  for (const name of RESERVED) {
    if (top.has(name)) problems.push(`reserved composition namespace present: ${name}/ is owned by the consumer`);
  }
  for (const name of NOT_PUBLISHABLE) {
    if (top.has(name)) problems.push(`not publishable entry present: ${name}`);
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
  const base = argv[1] ?? env.ILLUSIONIST_BASE ?? '/providence';
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
