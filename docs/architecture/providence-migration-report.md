# Providence as third client: migration report

Status: producer-side implementation done and verified locally on 2026-10-09 (Node 24.18.0); the release workflow has not run on GitHub yet and no release exists.

## 1. Provenance of the baseline

| Field | Value |
|-------|-------|
| Source repository | `SergioLacerda/providence` |
| Source path | `apps/landing` |
| Pinned ref | `origin/main` at `7bbfb67135eb0f2db2a212f65d5068b4e5090474` (2026-09-15, merge of PR #185) |
| Equivalent ref | `develop` at `b81f576aa0f861a3668dbcc9176a0d74370de896` (2026-09-20) has identical `apps/landing` content |
| Not used | the local `main` branch of the Providence checkout (`526b4ed`, 2026-08-17) is stale and does not match |
| Local copy | `base_providence/landing/` (nested one level), git-ignored, ephemeral |
| Import date | TBD by owner |
| Purpose | raw migration baseline |

How it was verified (2026-10-08): ignoring line endings, `base_providence/landing` equals `apps/landing` at `origin/main` and at `develop`. The copy carries CRLF line endings because the Providence checkout uses `core.autocrlf=true`. In the copy, the 35 baseline tests (5 files) pass.

Rules for the baseline:
- It is a raw model for copying and analysis. It is git-ignored, never versioned, and never edited.
- No build, test, package, CI or release step may reference it.
- The owner deletes it after Providence confirms its page was published successfully from the released surface (task 8.1).

## 2. Baseline inventory and classification

37 source files at the pinned ref. The copy on disk also holds `node_modules/`, `.astro/` and `coverage/`, which are not source. Classification does not authorize extraction.

| Directory | Files | Classification | Evidence |
|-----------|-------|----------------|----------|
| (root) | `package.json`, `package-lock.json`, `tsconfig.json`, `vitest.config.ts`, `vitest.setup.ts`, `.gitignore`, `.nvmrc` | TOOLCHAIN | Astro, TypeScript, Vitest, npm; `package.json` also carries the product-coupled `lint:md` scripts |
| (root) | `astro.config.mjs` | ENGINE + DEPLOYMENT_CONFIG | hardcoded `site` and `base` for `/providence/`, `outDir ../../build/site`, `emptyOutDir: false` |
| `public/assets/` | `sdd-mark.svg`, `sdd-wordmark.svg` | IDENTITY | |
| `public/shared/` | `site-header.css`, `site-header.js` | INTERACTION (shared with Selector and Docs) | mounted on Selector and Docs per its header comment; not referenced by the landing source |
| `src/` | `env.d.ts` | ENGINE | |
| `src/components/` | `BrandLogo.astro`, `SiteNav.astro`, `ScrollSectionNav.astro`, `VirtuesWheel.astro`, `InstallCard.astro` | SURFACE / INTERACTION | page composition and interaction scripts; out of the baseline coverage scope |
| `src/components/ds/` | `CapabilitiesPanel`, `RuntimeProof`, `GovernanceFooter`, `Terminal` (+ tests) | SURFACE / INTERACTION | React islands; two have tests |
| `src/layouts/` | `BaseLayout.astro` | SURFACE | |
| `src/lib/` | `i18n.ts` | CONTENT | all pt/en copy |
| `src/lib/` | `lang-bridge.ts`, `governance-stats.ts` (+ tests) | INTERACTION / PRIMITIVE (candidate) | language bridge; stats formatting |
| `src/lib/` | `governance-data.server.ts` (+ test) | PRODUCT-COUPLED (CONSUMER_CONFIG) | reads `.providence/metadata.json` from the repository root |
| `src/pages/` | `index.astro`, `detalhe-tecnico.astro`, `instalacao.astro` | SURFACE | |
| `src/styles/` | `global.css`, `tokens.css` | IDENTITY | |

## Facts found during discovery

- Stack: Astro `^7.3.2`, `@astrojs/react ^6.0.5`, React `^19.3.0`, TypeScript `^6.0.3`, Vitest `^5.0.0` with `happy-dom` per test file, `@testing-library/react` and `jest-dom`, `markdownlint-cli2`. Engines Node `>=24.18.0`; `.nvmrc` 24.19.0.
- Config: `site` `https://sergiolacerda.github.io/providence/`, `base` `/providence/`, `outDir` `../../build/site`, `emptyOutDir: false`.
- Tests: 35 passing; coverage scoped to `governance-stats`, `governance-data.server`, `lang-bridge`, `CapabilitiesPanel`, `RuntimeProof` with thresholds of 70.
- Product couplings: the governance stats loader reads `.providence/metadata.json` from the nearest ancestor with a `.git` entry; the `lint:md` and `lint-fix` scripts run from the Providence repository root.
- Links: the navigation has no link to `/docs/` and the Selector entry is `href="#"`. The only external link is the Providence GitHub repository.
- `public/shared/site-header.{css,js}` is the shared header mounted on Selector and Docs; the landing source does not reference it.
- Fonts come from the Google Fonts CDN.
- Governance values shown by the pages (read from the Providence working tree on 2026-10-08, to be re-read at the pinned SHA): 16 mandates, 23 guidelines, combined fingerprint `3c92a54d04d29611`. ILUSIONISTA's own governance snapshot has the same counts and a different fingerprint (`6b2505c66f25d5c4`), which is why the repository-root lookup cannot be kept.

## Gate decisions (owner replies, 2026-10-08)

| Id | Decision |
|----|----------|
| D1 | Location `web/providence/`, an independent npm project. |
| D2 | Pin Providence `origin/main` `7bbfb67`. |
| D3 | `base_providence/` is ephemeral and git-ignored, a raw model for copying and analysis, deleted after Providence confirms a successful publication. |
| D4 | Tag stream `providence-v*`, workflow `release-providence.yml`, archive `illusionist-providence-surface-vX.Y.Z.tar.gz` with `.sha256`. |
| D5 | The release values `ILLUSIONIST_SITE=https://sergiolacerda.github.io` and `ILLUSIONIST_BASE=/providence` belong to the Providence page. ILUSIONISTA has no landing page of its own. |
| D6 | Proposed and accepted with the package: a committed snapshot of the three governance values taken at the pinned SHA replaces the repository-root lookup. |
| D7 | Keep the baseline navigation; `/providence/docs/` and `/providence/selector/` are composition contracts. |
| D8 | 90% coverage standard for Strategist, RGB and Providence. Providence sets 90 after measuring, with tests added first. The Strategist raise stays the separate deferred step. |
| D9 | Reproduce at the baseline versions first, then move to the latest stable stack as a separate verified step (Node 26). |
| D10 | Structural gate fails if the output has `docs/` or `selector/`; composition simulation with mock namespaces. |

Open at the time of writing: the import date and the confirmation of the three governance values at the pinned SHA (task 1.2).

## 3. Dependencies found

- Runtime: Astro, `@astrojs/react`, React 19. Dev: Vitest, `@vitest/coverage-v8`, `happy-dom`, `@testing-library/react` and `jest-dom`, TypeScript, `@astrojs/check`, `@types/node`. Removed: `markdownlint-cli2`.
- Fonts come from the Google Fonts CDN, as shipped.
- No Python, `uv`, MkDocs, Selector compiler, `providence_cli`, `providence_pages` or Providence workspace is needed once the couplings in section 4 are removed.

## 4. Product couplings and removals

| Coupling in the baseline | Treatment |
|--------------------------|-----------|
| `governance-data.server.ts` reads the governance metadata file from the nearest ancestor with a `.git` entry (or `SDD_REPO_ROOT`), falling back to zeros | Replaced by the pinned snapshot `src/data/governance-snapshot.json` (16 mandates, 23 guidelines, fingerprint `3c92a54d04d29611`, read from the Providence file at the pinned SHA `7bbfb67`). Inside ILUSIONISTA the old lookup would have shown another fingerprint (`6b2505c66f25d5c4`) or zeros in CI. Tests first; one test asserts the module has no file system or repository-root access |
| `lint:md` and `lint-fix` run `markdownlint-cli2` from the Providence repository root | Removed with the `markdownlint-cli2` dependency |
| `outDir ../../build/site` and `emptyOutDir: false` (shared publication root) | Not carried over; the surface builds into its own `dist/` |
| Hardcoded `site` and `base` | Replaced by `ILLUSIONIST_SITE` and `ILLUSIONIST_BASE` through `src/config/deployment.ts` |
| Paths built as `BASE_URL + "name"` (found while testing) | Produced `/providenceassets/sdd-mark.svg` and `/providence` when the base has no trailing slash, which is how the deployment resolver normalizes it. Fixed with a tested `withBase()` helper used by `BrandLogo`, `SiteNav`, `BaseLayout` and `index` |

## 5. Responsibilities kept in Providence

MkDocs and `/docs/`, the Selector compiler, templates and `/selector/`, docs indexing and validation, compression, `_headers`, the copies of the shared header used by MkDocs and the Selector, final site composition and GitHub Pages deployment.

## 6. Responsibilities assumed by ILUSIONISTA

The presentation root: pages, components, layout, styles, identity assets, the shared header files as shipped, localized copy, the Astro build, presentation tests, base-path correctness, the structural gate and a deterministic, checksummed archive released by tag `providence-vX.Y.Z`.

## 7. Deliberate differences

| Difference | Reason |
|------------|--------|
| Package name `illusionist-providence`; `lint:md`, `lint-fix` and `markdownlint-cli2` removed | no dependency on the Providence repository |
| `astro.config.mjs`: resolver-based `site`/`base`, own `dist/`, no `emptyOutDir: false` | isolated build (demand section 24) |
| Governance numbers from a pinned snapshot | section 4 |
| `withBase()` replaces `BASE_URL` concatenation | section 4 |
| Test `governance-data.server.test.ts` rewritten (no `node:fs` mocking); new tests for the resolver, `withBase`, the structural gate, and the SSR and tab branches of `lang-bridge` and `CapabilitiesPanel` | adapted to the new loader; coverage gate |
| Coverage thresholds 90 (baseline 70); scope = baseline five modules + `paths`, `deployment`, `check-surface` | owner decision D8 |
| Dependencies upgraded (section 8) and `.nvmrc` 26 (baseline 24.19.0) | owner decision D9 |
| Navigation unchanged: Selector entry stays `href="#"`, no Docs link | owner decision D7; `/providence/docs/` and `/providence/selector/` are composition contracts and nothing in the build needs them |

## 8. Check, test and build results

Measured on 2026-10-09, Node 24.18.0 and npm 11.16 locally. `.nvmrc` is 26, which was **not** run locally; CI and the release workflow will exercise it.

| Step | Result |
|------|--------|
| Baseline tests in the baseline copy | 5 files, 35 tests passed |
| `make ci-providence` (npm ci, lint, coverage, build, gate), also run with `base_providence/` moved away | passed both times |
| Lint (`astro check`) | 0 errors, 0 warnings, 0 hints |
| Tests | 9 files, 80 tests passed (the 5 baseline test files are kept, one of them rewritten for the new loader) |
| Coverage | 98.5 statements, 95.4 branches, 100 functions, 100 lines; thresholds 90 |
| Build (Providence target) | 3 pages |
| Structural gate on the output | passed |
| Dependency upgrade (step 3.6) | `astro` 7.3.2 to 7.3.8, `@astrojs/react` 6.0.5 to 7.0.1, `vitest` and `@vitest/coverage-v8` to 5.0.3, `happy-dom` to 20.14.6, `@types/node` to 26.6.4. TypeScript stays at 6.0.3 (the newest 7.0.2 was not tried; `docs/build.md` holds TypeScript at the newest version `astro check` supports) |

## 9. Equivalence with the baseline

At the baseline's dependency versions, the active surface and a build of the baseline (with the governance values supplied through its `SDD_REPO_ROOT` override) have the same file set; the three HTML pages are byte-identical except for Astro's random `astro-island` `uid` values (identical once normalized); assets, the shared header files and the identity SVGs are identical. After the upgrade, markup is identical, the instalacao page is fully identical after normalization, and the home and `detalhe-tecnico` pages differ only inside the framework's inlined island bootstrap scripts; hashed asset names change. Static assets (`sdd-mark.svg`, `site-header.js`) are unchanged. Every local reference in the HTML starts with `/providence/`. Not checked: responsive behavior and visual rendering in a browser, interaction behavior beyond the unit tests.

## 10. Structural gate and composition simulation

- Gate (`scripts/check-surface.mjs`, with tests): required routes and assets exist; no `node_modules`, source, `base_providence`, `docs/` or `selector/`; every local reference stays under the base; the base itself is validated (a path mangled by a POSIX shell is rejected).
- Determinism: packing the output twice with the workflow's `tar` and `gzip -n` options gives identical SHA-256 locally.
- Consumer simulation (local): the archive was extracted twice into a root holding mock `docs/` and `selector/`; both mocks kept their checksums, and served under `/providence/` the three routes, the mocks, the shared header and the identity assets answered 200 and every `/providence/` link of the three pages answered 200.
- The same gate, determinism check and simulation are steps of `release-providence.yml`; they have not run on GitHub.

## 11. Strategist, RGB and Providence comparison

| Mechanism | Strategist | RGB | Providence | Evidence |
|-----------|-----------|-----|------------|----------|
| Deployment config via `ILLUSIONIST_SITE` / `ILLUSIONIST_BASE` | `deployment.ts` | identical copy | identical copy | strong: three copies |
| Immutable archive, checksum, tag guard, pinned actions | `release.yml` | `release-rgb.yml` | `release-providence.yml` | strong |
| Consumer-owned namespaces | none | `library/`, `downloads/` (composed by RGB) | `docs/`, `selector/` (reserved, checked) | different forms of the same rule |
| Structural gate on the output | none | none | `check-surface.mjs` | one consumer |
| Base join helper | normalizes `BASE_URL` inline in each page | `paths.ts` | `paths.ts` (`withBase`) | two different helpers |
| Framework | Astro + React | Astro | Astro + React | |

Observations only, nothing abstracted: (1) the deployment resolver is now copied three times (about 50 lines each); (2) the release job is copied three times (68 lines for the Strategist, 96 for Providence, which adds the gate, determinism check and simulation); (3) the reserved-namespace rule and gate exist for Providence and are described for RGB only in the composition design. Cost of extracting now: a shared package or reusable workflow across three differently versioned surfaces; benefit: removes duplication but couples releases. Revisit when a fourth consumer or a fix has to be applied in three places.

## 12. Risks

- The release workflow and the Node 26 pin have not run on GitHub; a failure there should be fixed with a new version, never by moving a tag.
- The governance snapshot can go stale against Providence; refreshing it is manual and must update the recorded ref.
- The Selector entry stays `href="#"`; the first composition will show a dead entry unless Providence or a later change links it.
- The page loads fonts from Google's CDN.
- A pending, separate wave plans a Selector surface in ILUSIONISTA; this surface does not contain or depend on it.
- After Providence publishes successfully, `base_providence/` is deleted by the owner; re-run lint, tests and build then and record it here (task 8.1).
