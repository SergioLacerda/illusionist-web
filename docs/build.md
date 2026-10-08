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

`site` and `base` are build-time inputs, `ILLUSIONIST_SITE` and `ILLUSIONIST_BASE`, read by `astro.config.mjs`. With neither set the build is neutral: `base` is `/` and the pages carry no `og:url` or canonical link. Local and CI builds are neutral; the release workflow sets both values for its target consumer (see [release.md](release.md)). A consumer that publishes under a subpath builds its own variant, for example `ILLUSIONIST_SITE=https://example.org ILLUSIONIST_BASE=/docs npm run build` (on Windows with Git Bash, prefix with `MSYS_NO_PATHCONV=1`). Fonts, `og:url` and canonical links follow these two values. Consumer links (repository, quickstart, releases, install) live in `src/config/consumer.ts`; persisted preference keys and events live in `src/config/storage.ts`.
