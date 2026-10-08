# RGB System as second client: migration report

Status: phases 0 to E executed and recorded below; phase F (composition design) is in [rgb-composition-design.md](rgb-composition-design.md). Section 2 and the later sections reflect the state on 2026-10-08.

## 1. Baseline

| Field | Value |
|-------|-------|
| Source repository | `SergioLacerda/rpg-system-rgb` |
| Source branch | `main` |
| Source commit SHA | `812b4fddc158db8b9bbc6c3e6f2f451ffbe118ae` (2026-09-27, merge of PR #31) |
| Functional origin | `web/` of the source repository, directory `web/landing` |
| Local copy | `base-rgb-landing/landing/` (59 files; git-ignored; ephemeral) |
| Extraction date | TBD by owner |
| Published page | `https://sergiolacerda.github.io/rpg-system-rgb/` (confirmed by the owner) |

Notes:
- The local copy is nested one level below `base-rgb-landing/`. It is byte-identical to `web/landing` at the SHA above.
- At analysis time the working tree of `rpg-system-rgb` has `web/landing` deleted (59 files), so the SHA, not the working tree, is the baseline identity.
- `base-rgb-landing/` is not part of ILUSIONISTA. It must never be versioned, referenced or used as a build, test, package, CI or release input.

## 2. Baseline files and classification

Categories follow the migration demand. Classification does not authorize extraction. Evidence comes from the baseline copy and from the RGB repository at the recorded SHA.

| Directory | Files | Classification | Evidence |
|-----------|-------|----------------|----------|
| (root) | `package.json`, `package-lock.json`, `tsconfig.json`, `vitest.config.ts`, `.gitignore`, `.prettierignore`, `.prettierrc.json` | TOOLCHAIN | Astro, TypeScript, Vitest, Prettier, npm; `vitest.config.ts` carries a base used as a test fixture |
| (root) | `astro.config.mjs` | ENGINE + DEPLOYMENT_CONFIG | hardcodes `site` and reads `ASTRO_BASE` (default `/rpg-system-rgb`); i18n `pt-br`/`en` |
| (root) | `README.md` | CONTENT (RGB-specific) | describes the Go Library build and `make landing-build`; not replicated |
| `generated/` | `core-v2-summary.json` | PRODUCT_GENERATED_INPUT | declared as an output of the RGB semantic projection (`docs/core/semantic/projection-manifest.v0.1.json`, `output_path` `web/landing/generated/core-v2-summary.json`), referenced by RGB drift scripts and Go tests, ignored by the landing's own `.gitignore`, imported by nothing in `src/`. Not replicated; U7 resolved |
| `public/` | `favicon.svg` | IDENTITY | |
| `public/downloads/` | 21 files (PDFs, Skill ZIPs, checksums, manifests, SBOM, provenance) | PRODUCT_ARTIFACT | produced by RGB PDF and Skill pipelines; not replicated |
| `src/` | `content.config.ts`, `env.d.ts` | ENGINE | Astro content collection for the Library scaffold; type shims |
| `src/components/` | `Header`, `Footer`, `HomePage`, `SkillCard` (+ tests) | SURFACE | RGB navigation and page composition |
| `src/components/` | `Logo.astro` | IDENTITY | |
| `src/components/` | `CodeBlock.astro`, `VectorCard.astro` | PRIMITIVE (candidate) | generic code block and card; used only by RGB, so not extracted |
| `src/content/library/` | `en/core/attack-resolution.md`, `pt-br/core/resolucao-de-ataque.md` | CONTENT | the RGB README calls it transitional scaffold content |
| `src/i18n/` | `dictionary.ts` (+ test) | CONTENT | all pt-br/en UI strings |
| `src/layouts/` | `BaseLayout.astro` | SURFACE | |
| `src/lib/` | `paths.ts` (+ test) | PRIMITIVE (candidate) + DEPLOYMENT_CONFIG | base-path helpers; contains a test-mode fallback base |
| `src/pages/` | `index.astro`, `[lang]/index`, `[lang]/instalacao`, `[lang]/skills/index` | SURFACE | |
| `src/pages/[lang]/library/` | `index.astro`, `[...slug].astro` | SURFACE (scaffold) | routes over the content collection |
| `src/styles/` | `tokens.css` | IDENTITY | |

## Gate decisions and assumptions

Decisions taken at the Approval Gate (2026-10-08):

| Id | Decision |
|----|----------|
| D1 | Rename `web/landing` to `web/strategist` first, behavior-neutral, then add `web/rgb-system`. The published `v0.1.0` release stays untouched. Under M010 the move is run by the owner. |
| D2 | Two independent npm projects with separate lockfiles; no workspaces. |
| D3 | Each landing page is released independently: own workflow, tag stream, version guard, archive name and checksum. The Strategist keeps `v*`; RGB uses `rgb-v*`. |
| D4 | `base-rgb-landing/` is the complete RGB page to analyze and replicate. The RGB page is published as its own GitHub Pages project at `https://sergiolacerda.github.io/rpg-system-rgb/`, separate from the Strategist page. |
| D5 | The Library presentation is self-contained in the RGB project. It is not shared, because only RGB uses it and a third client could conflict with it. The Go-generated Library output stays RGB-owned. |
| D6 | Coverage is 90% in each project's own configuration. |

Assumptions and owner corrections:

| Id | Status |
|----|--------|
| A1 | Confirmed by the owner. The RGB release uses site `https://sergiolacerda.github.io` and base `/rpg-system-rgb`, matching the published URL. They are passed through `ILLUSIONIST_SITE` and `ILLUSIONIST_BASE`. |
| A2 | Confirmed and narrowed. Each surface keeps its own Library presentation. Nothing is shared between surfaces. |
| A3 | Changed by the owner: current Strategist coverage is not a concern now and is to be addressed later. Task 5.1 of the package (raise the Strategist threshold to 90) is deferred. It is not part of this migration until the owner reopens it. D6 still applies to the RGB project. |

Open investigation carried into the implementation: U7, whether RGB tooling reads `generated/core-v2-summary.json` (task 2.3).

## 3. Dependencies found

- Runtime: Astro `^7.3.5` only. No React, no UI library.
- Dev: `@astrojs/check`, `typescript ^6.0.3`, `vitest ^4.1.11`, `@vitest/coverage-v8 ^4.1.11`, `prettier` with `prettier-plugin-astro`.
- Engines declared by the baseline: Node `>=26 <27`, npm `>=11 <12`. Versions were replicated as shipped; upgrading is a separate verified step.
- No Go, no RGB CLI and no RGB repository dependency in the page. The RGB README couples `landing-build` to `docs-build` in RGB's own Makefile; that coupling stays in RGB.

## 4. Generated inputs

- `generated/core-v2-summary.json`: RGB-generated projection, not consumed by the presentation. Left in RGB.
- `public/library/` (Go output of `cmd/rgb docs library`): RGB-generated, absent from the baseline copy and from this surface.
- `public/downloads/`: RGB artifacts, not replicated.

## 5. Responsibilities kept in RGB

Domain model, Go code and CLI, semantic documentation sources and compiler, Library generation and validation, PDF generation, Skill packaging, release manifests, SBOM and provenance, final site composition, and GitHub Pages deployment of `https://sergiolacerda.github.io/rpg-system-rgb/`.

## 6. Responsibilities assumed by ILUSIONISTA

Presentation source (pages, components, layout, styles, favicon), localized copy, Astro build, presentation tests, base-path correctness, and an independently versioned static archive (`illusionist-rgb-surface-vX.Y.Z.tar.gz` plus `.sha256`) released by tag `rgb-vX.Y.Z`.

## 7. Deliberate differences

| Difference | Reason |
|------------|--------|
| `package.json` name `illusionist-rgb-system` instead of `rgb-system-web` | surface identity inside ILUSIONISTA |
| `astro.config.mjs` reads `ILLUSIONIST_SITE` and `ILLUSIONIST_BASE` through `src/config/deployment.ts` instead of the hardcoded `site` and `ASTRO_BASE`; neutral default base `/` | one deployment contract for all surfaces; the release sets the RGB values |
| `src/config/deployment.ts` and its tests added; `src/config` included in coverage | tests first for the configuration behavior |
| `public/downloads/`, `generated/`, baseline `README.md` and baseline `package-lock.json` not copied; new lockfile created with `npm install` | RGB-owned payloads; independent lockfile (D2) |
| `.nvmrc` (26) added | CI and release read the Node version from it |
| Test fixture comment added in `vitest.config.ts` | the suite asserts links under `/rpg-system-rgb/`; not a deployment value |

Behavior observed in the baseline and preserved as is:
- the root `/library/` link (21 pages) and three `/downloads/` links point to RGB-owned paths that are absent from an isolated build;
- on Library entry pages the language switcher links to the other locale's slug, which does not exist (`/en/library/core/resolucao-de-ataque` and `/pt-br/library/core/attack-resolution` answer 404). Pre-existing baseline behavior, not fixed here.

## 8. Check, test and build results

Measured 2026-10-08 with Node 24.18.0 locally. The RGB surface declares Node 26, so npm warns EBADENGINE locally; CI uses 26.

| Check | Strategist (`web/strategist`) | RGB System (`web/rgb-system`) |
|-------|-------------------------------|--------------------------------|
| `npm ci` | passed | passed, 314 packages |
| `npm run lint` | 0 errors, 0 warnings | 0 errors, 0 warnings, 29 files |
| `npm test` | 10 files, 81 tests passed | 7 files, 30 tests passed (20 replicated, 10 new for deployment) |
| Coverage | threshold 80 (unchanged; raising it is deferred by the owner) | 98.82 statements, 93.15 branches, 100 functions, 98.75 lines; thresholds 90 |
| Build | 3 pages | 11 pages |

Rename (D1): the Strategist build with the `v0.1.0` values is identical before and after moving `web/landing` to `web/strategist` for every file except `epic/index.html`, where Astro's random `astro-island` `uid` changes on every build (identical once normalized). `illusionist-strategist-surface-v0.1.0.tar.gz` still verifies against its published checksum (`OK`).

Equivalence: building the baseline copy with `ASTRO_BASE=/rpg-system-rgb` and this surface with `ILLUSIONIST_BASE=/rpg-system-rgb` gives the same 14 files, byte for byte, excluding the baseline's `downloads/` payload. Local archive simulation: 27 entries at the archive root, `sha256sum -c` `OK`; served under `/rpg-system-rgb/`, the pt-BR and en home, installation, skills and library pages, `favicon.svg` and every local asset answer 200. Expected 404s: the three `/downloads/` files and `/library/` (composition requirements, section 11). The CI workflow and `release-rgb.yml` were written but have not run on GitHub yet.

## 9. Strategist and RGB comparison

| Capability | Strategist | RGB | Shared evidence |
|------------|-----------|-----|-----------------|
| Astro static engine | yes (`^7.3.5`) | yes (`^7.3.5`) | strong |
| TypeScript | yes (6.x) | yes (6.x) | strong |
| React | yes (islands) | no | none |
| Test stack | Vitest 5, jsdom, 80% | Vitest 4, node, 90% | weak: different environments |
| i18n | custom runtime toggle with localStorage | Astro i18n, localized routes | concept only |
| GitHub Pages base | `/strategist-skill` through the resolver | `/rpg-system-rgb` through the same resolver | strong: identical `deployment.ts` |
| Product-generated surfaces and downloads | none | Library, PDFs, Skills | consumer responsibility |
| Static artifact and release | `v*` tag, archive and checksum | `rgb-v*` tag, archive and checksum | strong: same packaging steps |

## 10. Abstraction candidates observed (not implemented)

| Candidate | Strategist evidence | RGB evidence | Repeated responsibility | Cost / benefit |
|-----------|--------------------|--------------|-------------------------|----------------|
| Deployment resolver (`deployment.ts` and test) | present | identical copy | yes: resolve and validate `ILLUSIONIST_SITE` / `ILLUSIONIST_BASE` | about 50 lines duplicated; extraction needs a shared package, which D2 avoids. Revisit with a third consumer |
| Release job (pack, checksum, `gh release create`) | `release.yml` | `release-rgb.yml` | yes | about 40 duplicated lines; a reusable workflow is possible, but divergence risk is low today |
| Base-path helpers (`paths.ts`) | not used (uses `BASE_URL` directly) | present | no | not a candidate yet |

## 11. Risks of the future composition

- `/library/` (root) is a link target owned by RGB. The scaffold routes live only under `/pt-br/library/` and `/en/library/`, so no path overlap exists today, but the scaffold pages would appear next to the generated Library under the same label. RGB must decide which one the header points to.
- `/downloads/...` links break until RGB mounts its artifacts.
- The surface is compiled for `/rpg-system-rgb/`; composing it at another base needs a rebuild.
- RGB must validate path conflicts before mounting `library/` and `downloads/` over the extracted archive.
- The language switcher defect on Library entry pages (section 7) would be visible after composition.
- RGB's `web/landing` stays in place as reference and rollback until a published ILUSIONISTA RGB release passes download, checksum, extraction and composition checks.

## 12. Evidence that `base-rgb-landing/` was removed without impact

`base-rgb-landing/` was moved out of the repository, then `web/rgb-system` ran `npm ci`, lint, tests and build successfully, and it was moved back. It is git-ignored (`.gitignore` line 1) and nothing in the workflows, make targets, configs or sources references it. The baseline was not deleted, because the owner keeps it as the complete reference page; deleting it later changes nothing.
