# web/

Static web surfaces built by ILUSIONISTA. Today it holds four independent surfaces: the Strategist landing, the RGB System landing, the Providence landing and the Providence Selector.

## Structure

```
web/
├── strategist/    ← Strategist landing (Astro + React islands, static output)
├── rgb-system/    ← RGB System landing (Astro, pt-BR/en, static output)
├── providence/    ← Providence presentation root (Astro + React islands, static output)
└── providence-selector/ ← Providence Selector presentation (Astro, TypeScript, static output)
```

The Strategist design system prototypes that used to live in `web/design/` were moved out of this tree to `base_strategist/` at the repository root (git-ignored). `web/strategist` has no references to it.

## strategist/

Astro static site with minimal React islands (tabs, language toggle, copy button, features and mission panels):

- real HTML on first load (SEO, no-JS, fast LCP)
- self-hosted woff2 fonts and fingerprinted assets
- three routes: `/`, `pragmatic/`, `epic/`

### Dev

```bash
cd web/strategist
npm ci
npm run dev       # localhost:4321
```

### Build

```bash
cd web/strategist
npm run build     # → web/strategist/dist/
npm run preview   # preview of the static build
```

Or from the repository root:

```bash
make build-site   # npm ci + build
make check-web    # Astro type/template check
make test-web     # Vitest suite
make preview-site # preview of the static build
make ci-web       # install, check, test, coverage, build
```

See [docs/build.md](../docs/build.md) for requirements and the full command list.

### Deploy

`dist/` is plain static output and can be served by any CDN or static host. Deployment belongs to the consumer, not to ILUSIONISTA.

### Base path and custom domain

Deployment values are build-time inputs read by `astro.config.mjs` through `src/config/deployment.ts`:

| Variable | Meaning | Default |
|----------|---------|---------|
| `ILLUSIONIST_SITE` | Absolute `http(s)` origin of the deployment | unset: no `og:url` and no canonical link |
| `ILLUSIONIST_BASE` | Path the surface is served under, such as `/docs` | `/` |

With neither set the build is neutral and is meant to be served from the root of a host. A consumer that publishes under a subpath, or wants `og:url` and canonical links, builds its own variant, for example:

```bash
ILLUSIONIST_SITE=https://example.org ILLUSIONIST_BASE=/docs npm run build
```

Fonts (`src/styles/tokens/fonts.css`) use `/fonts/...` and the pages build `og:url` and canonical from `Astro.site` plus `BASE_URL`, so these two variables are the only place to change. Invalid values fail the build. On Windows with Git Bash, prefix the command with `MSYS_NO_PATHCONV=1`, otherwise the shell rewrites `/docs` into a Windows path (the build rejects it).

### Consumer-specific values

- `src/config/consumer.ts`: repository, quickstart, license, releases and install URLs
- `src/config/storage.ts`: `localStorage` keys and cross-island event names (kept as shipped so stored visitor preferences keep working)
- `src/data/*.ts`: Strategist product content

## rgb-system/

Astro static site (no React) replicated from the RGB System landing at `SergioLacerda/rpg-system-rgb` commit `812b4fddc158db8b9bbc6c3e6f2f451ffbe118ae`. See [docs/architecture/rgb-migration-report.md](../docs/architecture/rgb-migration-report.md).

- routes: `/` (redirect to `/pt-br/`), `/pt-br/` and `/en/` with `instalacao/`, `skills/` and `library/`
- the Library routes (`src/pages/[lang]/library/`, `src/content/library/`) are self-contained in this project and are not shared with the Strategist surface
- RGB owns and produces the generated Library (`/library/`), PDFs, Skill packages and their manifests; the page only links to them (`/library/` and `/downloads/...` are composition requirements and do not exist in this build)
- tests: Vitest 4 with 90% thresholds (`npm test` runs coverage)

```bash
cd web/rgb-system
npm ci
npm run lint
npm test
ILLUSIONIST_SITE=https://sergiolacerda.github.io ILLUSIONIST_BASE=/rpg-system-rgb npm run build
```

`site` and `base` follow the same `ILLUSIONIST_SITE` / `ILLUSIONIST_BASE` contract as the Strategist surface (`src/config/deployment.ts`). With neither set the build is neutral (base `/`).

## providence/

Astro static site with React islands, replicated from `apps/landing` of `SergioLacerda/providence` (pinned `origin/main` `7bbfb67135eb0f2db2a212f65d5068b4e5090474`). See [docs/architecture/providence-migration-report.md](../docs/architecture/providence-migration-report.md).

- routes: `/`, `detalhe-tecnico/`, `instalacao/`
- it is only the presentation root. `/docs/` (MkDocs) and `/selector/` (Selector compiler), post-processing, composition and deployment belong to Providence; the surface and its archive never contain `docs/` or `selector/`
- the governance numbers shown on the pages come from a pinned snapshot (`src/data/governance-snapshot.json`), not from the repository the build runs in
- tests: Vitest 5 with 90% thresholds (`npm run cover`); structural gate: `node scripts/check-surface.mjs dist /providence`

```bash
cd web/providence
npm ci
npm run lint
npm run cover
ILLUSIONIST_SITE=https://sergiolacerda.github.io ILLUSIONIST_BASE=/providence npm run build
```

Same `ILLUSIONIST_SITE` / `ILLUSIONIST_BASE` contract as the other surfaces (`src/config/deployment.ts`); with neither set the build is neutral (base `/`). On Windows with Git Bash, prefix with `MSYS_NO_PATHCONV=1`.

## providence-selector/

Static Selector page that lets a user pick governed mandates and guidelines and export a `selector-selection.json`. It is presentation only: Providence produces and validates the governed `data.json`, which the consumer places beside `index.html` at composition time (`docs.index.json` is optional). See [docs/contracts/providence-selector-data-v1.md](../docs/contracts/providence-selector-data-v1.md) and [docs/architecture/providence-selector-migration.md](../docs/architecture/providence-selector-migration.md).

- build for `/providence/selector`; the output never contains `data.json`, `docs.index.json`, fixtures or governance files (structural gate)
- `npm run dev` serves the fixtures in `fixtures/` where the consumer would put the data
- tests: Vitest 5 with 90% thresholds (`npm run cover`), including a compatibility test over a real Providence payload from a pinned commit

```bash
cd web/providence-selector
npm ci
npm run lint
npm run cover
ILLUSIONIST_SITE=https://sergiolacerda.github.io ILLUSIONIST_BASE=/providence/selector npm run build
node scripts/check-surface.mjs dist /providence/selector
```

On Windows with Git Bash, prefix with `MSYS_NO_PATHCONV=1`.
