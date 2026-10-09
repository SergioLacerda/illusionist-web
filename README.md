# ILUSIONISTA (illusionist-web)

Builds, tests and packages static web surfaces for products. Four real surfaces exist today: the Strategist landing page in `web/strategist/`, the RGB System landing page in `web/rgb-system/` the Providence landing page in `web/providence/` and the Providence Selector in `web/providence-selector/`. Each is built, tested and released independently.

> ILUSIONISTA owns presentation production. Products own their domain-specific capabilities, site composition and deployment.

## Layout

| Path | Purpose |
|------|---------|
| `web/strategist/` | Landing source (Astro 7, React 19, TypeScript 6, Vitest 5, npm), three routes: `/`, `pragmatic/`, `epic/` |
| `web/rgb-system/` | RGB System landing source (Astro 7, TypeScript 6, Vitest 4, npm), pt-BR/en routes under `/pt-br/` and `/en/`. Library presentation is self-contained here |
| `web/providence/` | Providence presentation root (Astro 7, React 19, TypeScript 6, Vitest 5, npm), routes `/`, `detalhe-tecnico/`, `instalacao/`. `/docs/` and `/selector/` are left free for Providence |
| `web/providence-selector/` | Providence Selector presentation (Astro 7, TypeScript 6, Vitest 5, npm), one page at `/providence/selector/`. Governed `data.json` is injected by Providence |
| `docs/build.md` | Install, check, test, build and preview commands |
| `docs/architecture/rgb-migration-report.md` | RGB migration report (baseline, classification, decisions) |
| `docs/architecture/rgb-composition-design.md` | How RGB composes its site from the RGB surface archive (design only) |
| `.github/workflows/ci.yml` | CI: one job per surface (`npm ci`, lint, tests, build on the Node pinned in its `.nvmrc`) |
| `.github/workflows/release.yml` | Strategist release, tags `vX.Y.Z` |
| `.github/workflows/release-rgb.yml` | RGB System release, tags `rgb-vX.Y.Z` |
| `.github/workflows/release-providence.yml` | Providence release, tags `providence-vX.Y.Z` |
| `.github/workflows/release-providence-selector.yml` | Providence Selector release, tags `providence-selector-vX.Y.Z` |
| `docs/architecture/providence-migration-report.md` | Providence migration report (provenance, decisions, results) |

## Quick start

Requires Node 26 (`.nvmrc` of each surface; the Strategist minimum is 22.12, RGB System declares `>=26 <27`).

```bash
cd web/strategist
npm ci
npm run build     # static output in dist/
npm run preview   # http://localhost:4321/
```

The output in `dist/` is plain static files and needs no Node runtime to be hosted. See [docs/build.md](docs/build.md) for all commands.

## Status

v0: the Strategist landing was extracted as-is and made independent of the Strategist repository. `site` and `base` are build-time inputs (`ILLUSIONIST_SITE`, `ILLUSIONIST_BASE`) with a neutral default, so no consumer deployment value is baked into the source or into a release. No universal abstraction has been introduced yet; the architecture is meant to emerge from real consumers.
