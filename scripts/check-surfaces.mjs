#!/usr/bin/env node
// Surface registry parity check.
//
// The set of web surfaces is declared in several places that must not drift:
//   1. web/*/package.json              (what exists)
//   2. make/web.mk                     (GLOBAL_SURFACE_DIRS, GLOBAL_SURFACES,
//                                       GLOBAL_GATED_SURFACES, the
//                                       global-{lint,test,coverage,audit,build}-<name> and
//                                       global-gate-<name> recipes, and the quality/ci
//                                       aggregates)
//   3. .github/workflows/ci.yml        (one job per surface; the audit matrix; the
//                                       structural gate of each gated surface)
//   4. docs/architecture/global-quality-gates.md (registered surfaces table)
//   5. README.md                       (layout table)
//
// Dependency-free on purpose: the repository has no root dependency tree.
// Exit code 0 when every declaration agrees, 1 otherwise.

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const GATES = ['lint', 'test', 'coverage', 'audit', 'build'];
const GATE_SCRIPT = 'scripts/check-surface.mjs';

const root = process.env.SURFACES_ROOT ?? join(fileURLToPath(new URL('.', import.meta.url)), '..');
const read = (rel) => readFileSync(join(root, rel), 'utf8');
const errors = [];
const fail = (message) => errors.push(message);

const sameSet = (a, b) => a.length === b.length && a.every((item) => b.includes(item));
const diff = (label, expected, actual) => {
  const missing = expected.filter((item) => !actual.includes(item));
  const extra = actual.filter((item) => !expected.includes(item));
  const parts = [];
  if (missing.length) parts.push(`missing: ${missing.join(', ')}`);
  if (extra.length) parts.push(`unexpected: ${extra.join(', ')}`);
  fail(`${label} differs from web/*/package.json (${parts.join('; ')})`);
};

// 1. Surfaces that exist on disk.
const webDir = join(root, 'web');
const onDisk = readdirSync(webDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && existsSync(join(webDir, entry.name, 'package.json')))
  .map((entry) => `web/${entry.name}`)
  .sort();
if (onDisk.length === 0) fail('no web/*/package.json found');

// 2. make/web.mk registry and recipes.
const mk = read('make/web.mk');
const assignment = (name) => {
  const match = mk.match(new RegExp(`^${name}\\s*:?=\\s*(.+)$`, 'm'));
  return match ? match[1].trim().split(/\s+/) : null;
};
const registryDirs = assignment('GLOBAL_SURFACE_DIRS');
const registryNames = assignment('GLOBAL_SURFACES');
const registryGated = assignment('GLOBAL_GATED_SURFACES');
if (!registryDirs) fail('make/web.mk: GLOBAL_SURFACE_DIRS is not declared');
if (!registryNames) fail('make/web.mk: GLOBAL_SURFACES is not declared');
if (!registryGated) fail('make/web.mk: GLOBAL_GATED_SURFACES is not declared');

if (registryDirs && !sameSet([...registryDirs].sort(), onDisk)) {
  diff('make/web.mk GLOBAL_SURFACE_DIRS', onDisk, registryDirs);
}

const recipeDir = (gate, name) => {
  const match = mk.match(new RegExp(`^global-${gate}-${name}:[^\\n]*\\n((?:\\t[^\\n]*\\n?)+)`, 'm'));
  if (!match) return null;
  const cd = match[1].match(/cd\s+(web\/[\w.-]+)\s*&&/);
  return cd ? cd[1] : undefined;
};

const dirByName = new Map();
if (registryNames) {
  for (const name of registryNames) {
    for (const gate of GATES) {
      const dir = recipeDir(gate, name);
      if (dir === null) {
        fail(`make/web.mk: target global-${gate}-${name} is not defined`);
      } else if (dir === undefined) {
        fail(`make/web.mk: target global-${gate}-${name} has no "cd web/<surface> &&" recipe`);
      } else if (dirByName.has(name) && dirByName.get(name) !== dir) {
        fail(`make/web.mk: surface ${name} targets different directories (${dirByName.get(name)} and ${dir})`);
      } else {
        dirByName.set(name, dir);
      }
    }
  }
  const recipeDirs = [...dirByName.values()];
  if (!sameSet([...recipeDirs].sort(), onDisk)) diff('make/web.mk global recipes', onDisk, recipeDirs);
  if (registryDirs && registryDirs.length === registryNames.length) {
    registryNames.forEach((name, index) => {
      if (dirByName.get(name) && dirByName.get(name) !== registryDirs[index]) {
        fail(`make/web.mk: GLOBAL_SURFACES and GLOBAL_SURFACE_DIRS disagree at position ${index + 1} (${name} -> ${dirByName.get(name)}, expected ${registryDirs[index]})`);
      }
    });
  } else if (registryDirs) {
    fail('make/web.mk: GLOBAL_SURFACES and GLOBAL_SURFACE_DIRS have different lengths');
  }
}

// Structural gates: a surface ships one when it has scripts/check-surface.mjs.
const gatedDirs = onDisk.filter((dir) => existsSync(join(root, dir, GATE_SCRIPT)));
if (registryNames && registryGated) {
  const gatedByRegistry = registryGated.map((name) => dirByName.get(name));
  if (registryGated.some((name) => !registryNames.includes(name))) {
    fail('make/web.mk: GLOBAL_GATED_SURFACES lists a surface that is not in GLOBAL_SURFACES');
  }
  if (!sameSet([...gatedByRegistry].sort(), [...gatedDirs].sort())) {
    diff(`make/web.mk GLOBAL_GATED_SURFACES (surfaces with ${GATE_SCRIPT})`, gatedDirs, gatedByRegistry.filter(Boolean));
  }
  for (const name of registryGated) {
    const dir = recipeDir('gate', name);
    if (dir === null) fail(`make/web.mk: target global-gate-${name} is not defined`);
    else if (dir !== dirByName.get(name)) fail(`make/web.mk: target global-gate-${name} must run in ${dirByName.get(name)}`);
  }
}

// Aggregate targets must be derived from the registry, not hard-coded per surface.
const aggregates = [
  ...GATES.filter((gate) => gate !== 'build').map((gate) => [gate, '$(GLOBAL_SURFACES)']),
  ['build-all', '$(GLOBAL_SURFACES)'],
  ['gates', '$(GLOBAL_GATED_SURFACES)'],
];
for (const [target, variable] of aggregates) {
  const aggregate = mk.match(new RegExp(`^${target}:\\s*([^\\n]*)$`, 'm'));
  if (!aggregate) {
    fail(`make/web.mk: aggregate target ${target} is not defined`);
  } else if (!aggregate[1].includes(variable)) {
    fail(`make/web.mk: aggregate target ${target} must expand ${variable} instead of listing surfaces`);
  }
}
const composite = (target, required) => {
  const match = mk.match(new RegExp(`^${target}:\\s*([^\\n]*)$`, 'm'));
  if (!match) return fail(`make/web.mk: composite target ${target} is not defined`);
  const have = match[1].trim().split(/\s+/);
  for (const item of required) {
    if (!have.includes(item)) fail(`make/web.mk: target ${target} must depend on ${item}`);
  }
};
composite('quality', ['check-surfaces', 'lint', 'coverage', 'audit']);
composite('ci', ['quality', 'build-all', 'gates']);

// 3. CI: one job per surface (job id equals the directory name) and the audit matrix.
const ci = read('.github/workflows/ci.yml');
const jobsBlock = ci.split(/^jobs:\s*$/m)[1] ?? '';
const jobIds = [...jobsBlock.matchAll(/^ {2}([\w-]+):\s*$/gm)].map((match) => match[1]);
const surfaceNames = onDisk.map((dir) => basename(dir));
for (const name of surfaceNames) {
  if (!jobIds.includes(name)) fail(`.github/workflows/ci.yml: no job "${name}" for web/${name}`);
}
for (const dir of gatedDirs) {
  const name = basename(dir);
  const block = (jobsBlock.match(new RegExp(`^ {2}${name}:\\s*$([\\s\\S]*?)(?=^ {2}[\\w-]+:\\s*$|(?![\\s\\S]))`, 'm')) ?? [])[1] ?? '';
  if (!block.includes('check-surface.mjs')) fail(`.github/workflows/ci.yml: job "${name}" does not run ${GATE_SCRIPT}`);
}
const auditBlock = (jobsBlock.match(/^ {2}audit:\s*$([\s\S]*?)(?=^ {2}[\w-]+:\s*$|(?![\s\S]))/m) ?? [])[1] ?? '';
const matrix = auditBlock.match(/surface:\s*\[([^\]]*)\]/);
if (!matrix) {
  fail('.github/workflows/ci.yml: job "audit" has no "surface: [...]" matrix');
} else {
  const audited = matrix[1].split(',').map((item) => item.trim()).filter(Boolean);
  if (!sameSet([...audited].sort(), [...surfaceNames].sort())) {
    diff('.github/workflows/ci.yml audit matrix', surfaceNames, audited);
  }
}

// 4. Documentation table of registered surfaces.
const gatesDoc = read('docs/architecture/global-quality-gates.md');
const documented = [...gatesDoc.matchAll(/^\|[^|]*\|\s*`(web\/[\w.-]+)`\s*\|/gm)].map((match) => match[1]).sort();
if (!sameSet(documented, onDisk)) diff('docs/architecture/global-quality-gates.md surface table', onDisk, documented);

// 5. README layout table.
const readme = read('README.md');
for (const dir of onDisk) {
  if (!readme.includes(`\`${dir}/\``)) fail(`README.md: layout table does not mention ${dir}/`);
}

if (errors.length > 0) {
  console.error('[surfaces] registry drift detected:');
  for (const message of errors) console.error(`  - ${message}`);
  process.exit(1);
}
console.log(`[surfaces] ${onDisk.length} surfaces consistent across make, CI, docs and README: ${onDisk.join(' ')} (structural gate: ${gatedDirs.join(' ')})`);
