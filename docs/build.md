# Building the landing

The landing lives in `web/landing/` (Astro 7, React 19, TypeScript 6, Vitest 5, npm). It builds to static files that need no Node, Astro, React or npm to be hosted.

## Requirements

- Node `>=22.12.0` (declared in `web/landing/package.json`); `web/landing/.nvmrc` pins the current major (26), so `nvm use` in that folder selects it
- npm, using the committed `package-lock.json`
- Policy: always the latest stable stack, no fallbacks or backward-compatibility shims. The one exception is TypeScript, held at the newest version `astro check` supports (6.x); TypeScript 7.0 is rejected by `astro check`, and 7.1+ is reachable only through `@astrojs/ts-content-mapper`
- On machines with several Node versions, make sure `node -v` reports `>=22.12.0` before `npm ci`; an old Node makes `npm ci` fail after clearing `node_modules/`

## Commands

Run from `web/landing/`:

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

## Output

`npm run build` writes static files to `web/landing/dist/` (`index.html`, `pragmatic/`, `epic/`, `fonts/`, `_assets/`, `robots.txt`). Serve that directory with any static server.

## Deployment-specific note

`astro.config.mjs` currently sets `site: https://sergiolacerda.github.io` and `base: /strategist-skill`, which belong to the Strategist consumer's GitHub Pages deployment. Fonts and `og:url` follow `site` and `base`, so changing them in the config is enough. Consumer links (repository, quickstart, releases, install) live in `src/config/consumer.ts`; persisted preference keys and events live in `src/config/storage.ts`.
