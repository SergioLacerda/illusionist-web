# web/

Static web surfaces built by ILUSIONISTA. Today it holds one surface: the Strategist landing.

## Structure

```
web/
└── landing/    ← production site (Astro static output)
```

The Strategist design system prototypes that used to live in `web/design/` were moved out of this tree to `base_strategist/` at the repository root (git-ignored). `web/landing` has no references to it.

## landing/

Astro static site with minimal React islands (tabs, language toggle, copy button, features and mission panels):

- real HTML on first load (SEO, no-JS, fast LCP)
- self-hosted woff2 fonts and fingerprinted assets
- three routes: `/`, `pragmatic/`, `epic/`

### Dev

```bash
cd web/landing
npm ci
npm run dev       # localhost:4321
```

### Build

```bash
cd web/landing
npm run build     # → web/landing/dist/
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
