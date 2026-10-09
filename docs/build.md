# Building the surfaces

The landing lives in `web/strategist/` (Astro 7, React 19, TypeScript 6, Vitest 5, npm). It builds to static files that need no Node, Astro, React or npm to be hosted.

## Requirements

- Node `>=22.12.0` (declared in `web/strategist/package.json`); `web/strategist/.nvmrc` pins the current major (26), so `nvm use` in that folder selects it
- npm, using the committed `package-lock.json`
- Policy: always the latest stable stack, no fallbacks or backward-compatibility shims. The one exception is TypeScript, held at the newest version `astro check` supports (6.x); TypeScript 7.0 is rejected by `astro check`, and 7.1+ is reachable only through `@astrojs/ts-content-mapper`
- On machines with several Node versions, make sure `node -v` reports `>=22.12.0` before `npm ci`; an old Node makes `npm ci` fail after clearing `node_modules/`

## Commands

Run from `web/strategist/`:

| Purpose | Command |
|---------|---------|
| Install dependencies reproducibly | `npm ci` |
| Dev server | `npm run dev` |
| Type and template check (lint) | `npm run lint` |
| Tests | `npm test` |
| Tests with coverage | `npm run cover` |
| Production build | `npm run build` |
| Local preview of the build | `npm run preview` |

The same workflow is available from the repository root through `make/web.mk`:

| Purpose | Command |
|---------|---------|
| Install dependencies | `make install-web` |
| Type and template check | `make check-web` |
| Tests | `make test-web` |
| Tests with coverage | `make cover-web` |
| Production build | `make build-site` |
| Local preview | `make preview-site` |
| Full CI-style web check | `make ci-web` |

## RGB System surface

`web/rgb-system/` is built the same way (Astro 7, TypeScript 6, Vitest 4, npm; Node `>=26 <27`, pinned by its `.nvmrc`). Commands run from `web/rgb-system/`: `npm ci`, `npm run lint`, `npm test` (coverage, 90% thresholds), `npm run build`. From the repository root: `make ci-rgb`, `make build-rgb`, `make check-rgb`, `make test-rgb`. It needs no Go, no RGB CLI and no RGB repository. The same `ILLUSIONIST_SITE` and `ILLUSIONIST_BASE` inputs apply; its release uses `https://sergiolacerda.github.io` and `/rpg-system-rgb`.

## Providence surface

`web/providence/` is built the same way (Astro 7, React 19, TypeScript 6, Vitest 5, npm; Node pinned by its `.nvmrc`). Commands run from `web/providence/`: `npm ci`, `npm run lint`, `npm run cover` (coverage, 90% thresholds), `npm run build`, then `node scripts/check-surface.mjs dist /providence` (structural gate). From the repository root: `make ci-providence`, `make build-providence`, `make gate-providence`. It needs no Python, `uv`, MkDocs, Selector compiler or Providence workspace. Its release uses `https://sergiolacerda.github.io` and `/providence`.

## Providence Selector surface

`web/providence-selector/` follows the same commands as the other surfaces (`npm ci`, `npm run lint`, `npm run cover`, `npm run build`, then `node scripts/check-surface.mjs dist /providence/selector`), or `make ci-selector` from the repository root. It needs no Python, `uv`, `.providence`, MkDocs, Providence checkout or GitHub API. Fixtures in `fixtures/` are for development and tests only; the real-payload compatibility evidence lives in `compat/`.

## Output

`npm run build` writes static files to `web/strategist/dist/` (`index.html`, `pragmatic/`, `epic/`, `fonts/`, `_assets/`, `robots.txt`). Serve that directory with any static server.

## Deployment-specific note

`site` and `base` are build-time inputs, `ILLUSIONIST_SITE` and `ILLUSIONIST_BASE`, read by `astro.config.mjs`. With neither set the build is neutral: `base` is `/` and the pages carry no `og:url` or canonical link. Local and CI builds are neutral; the release workflow sets both values for its target consumer (see [release.md](release.md)). A consumer that publishes under a subpath builds its own variant, for example `ILLUSIONIST_SITE=https://example.org ILLUSIONIST_BASE=/docs npm run build` (on Windows with Git Bash, prefix with `MSYS_NO_PATHCONV=1`). Fonts, `og:url` and canonical links follow these two values. Consumer links (repository, quickstart, releases, install) live in `src/config/consumer.ts`; persisted preference keys and events live in `src/config/storage.ts`.
