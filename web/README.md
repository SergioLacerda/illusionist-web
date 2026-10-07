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

`astro.config.mjs` is configured for the Strategist GitHub Pages deployment:

```js
site: 'https://sergiolacerda.github.io',
base: '/strategist-skill',
```

Fonts (`src/styles/tokens/fonts.css`) use `/fonts/...` and the pages build `og:url` from `Astro.site` plus `BASE_URL`, so the config is the only place to change. For a custom domain without a subpath, remove `base` (or set `base: '/'`) and update `site`.

### Consumer-specific values

- `src/config/consumer.ts`: repository, quickstart, license, releases and install URLs
- `src/config/storage.ts`: `localStorage` keys and cross-island event names (kept as shipped so stored visitor preferences keep working)
- `src/data/*.ts`: Strategist product content
