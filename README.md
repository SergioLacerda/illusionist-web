# ILUSIONISTA (illusionist-web)

Builds, tests and packages static web surfaces for products. The first real case is the Strategist landing page, kept in `web/landing/`.

> ILUSIONISTA owns presentation production. Products own their domain-specific capabilities, site composition and deployment.

## Layout

| Path | Purpose |
|------|---------|
| `web/landing/` | Landing source (Astro 7, React 19, TypeScript 6, Vitest 5, npm), three routes: `/`, `pragmatic/`, `epic/` |
| `docs/build.md` | Install, check, test, build and preview commands |
| `.github/workflows/ci.yml` | CI: `npm ci`, lint, tests and build on the Node pinned in `.nvmrc` |

## Quick start

Requires Node 26 (`web/landing/.nvmrc`; minimum 22.12).

```bash
cd web/landing
npm ci
npm run build     # static output in dist/
npm run preview   # http://localhost:4321/
```

The output in `dist/` is plain static files and needs no Node runtime to be hosted. See [docs/build.md](docs/build.md) for all commands.

## Status

v0: the Strategist landing was extracted as-is and made independent of the Strategist repository. `site` and `base` are build-time inputs (`ILLUSIONIST_SITE`, `ILLUSIONIST_BASE`) with a neutral default, so no consumer deployment value is baked into the source or into a release. No universal abstraction has been introduced yet; the architecture is meant to emerge from real consumers.
