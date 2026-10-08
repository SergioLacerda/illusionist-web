# RGB site composition design (phase F, design only)

Status: design. Nothing in the `rpg-system-rgb` repository was changed to produce it. The RGB repository is read only here, and its migration starts only after the gate in section 7 passes.

## 1. Ownership

| Part | Owner |
|------|-------|
| Presentation surface archive (`illusionist-rgb-surface-vX.Y.Z.tar.gz` plus `.sha256`) | ILUSIONISTA |
| Library generation (`cmd/rgb docs library`), PDFs, Skill packages, manifests, SBOM, provenance | RGB |
| Composition of the final tree, GitHub Pages deployment | RGB |

## 2. Facts about the RGB pipeline today (read from `rpg-system-rgb` at `812b4fd`)

- `make landing-build` depends on `docs-build` and runs `ASTRO_BASE=/rpg-system-rgb npm run build` in `web/landing`.
- `docs-build` runs `go run ./cmd/rgb docs library --source docs --out web/landing/public/library`. Astro then copies `public/` into `dist/`, which is how `library/` and `downloads/` reach the site.
- PDFs and Skill ZIPs are produced by `docs-pdf` and `skill-package`, uploaded as the CI artifacts `landing-pdfs` and `landing-skills`, and downloaded by the `deploy` job into `web/landing/public/downloads`.
- The `deploy` job (push to `main`) installs Go and Node 26, runs `make landing-install` and `make landing-build`, then `configure-pages`, `upload-pages-artifact` with `web/landing/dist`, and `deploy-pages`. The `smoke-test-pdf` job checks the published PDF links.
- The published base is `/rpg-system-rgb` on `https://sergiolacerda.github.io`, identical to the release values of the ILUSIONISTA RGB surface (`release-rgb.yml`).

## 3. Target flow

```text
RGB CI
  docs-build      -> library/            (Go, stays in RGB)
  docs-pdf        -> downloads/*.pdf     (stays in RGB)
  skill-package   -> downloads/*.zip     (stays in RGB)
  download exact ILUSIONISTA RGB surface rgb-vX.Y.Z
  verify SHA-256
  extract         -> site/
  conflict check  (library/ and downloads/ must be absent from the archive)
  mount           -> site/library/  <- generated Library
                  -> site/downloads/ <- generated artifacts
  upload-pages-artifact (site/)
  deploy-pages
```

Mount model, no framework:

| Mount | Source |
|-------|--------|
| `/` | ILUSIONISTA RGB presentation surface (extracted archive) |
| `/library` | RGB-generated Library |
| `/downloads` | RGB-generated artifacts |

## 4. Version pin

The RGB workflow consumes an exact release and never `latest`, `main` or a workflow run:

```text
ILLUSIONIST_RGB_SURFACE_VERSION=v0.1.0      # asset of the release tagged rgb-v0.1.0
```

## 5. Workflow sketch (to be written by the RGB migration, not applied)

```yaml
deploy:
  needs: [lint, docs, docs-pdf, skill-package, generated-drift, lint-yaml, lint-shell, governance-files]
  steps:
    - uses: actions/checkout@<sha>
    - uses: actions/setup-go@<sha>
    - run: make docs-build LIBRARY_DIR=site-parts/library
    - uses: actions/download-artifact@<sha>      # landing-pdfs and landing-skills
      with: { name: landing-pdfs, path: site-parts/downloads }
    - uses: actions/download-artifact@<sha>
      with: { name: landing-skills, path: site-parts/downloads }
    - name: Fetch the pinned ILUSIONISTA surface
      env:
        GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        V: v0.1.0
      run: |
        gh release download "rgb-$V" --repo SergioLacerda/illusionist-web \
          --pattern "illusionist-rgb-surface-$V.tar.gz*" --dir surface
        (cd surface && sha256sum -c "illusionist-rgb-surface-$V.tar.gz.sha256")
        mkdir site && tar -xzf "surface/illusionist-rgb-surface-$V.tar.gz" -C site
    - name: Refuse path conflicts
      run: |
        for d in library downloads; do
          if [ -e "site/$d" ]; then echo "::error::surface archive already contains $d/"; exit 1; fi
        done
    - run: cp -r site-parts/library site/library && cp -r site-parts/downloads site/downloads
    - uses: actions/configure-pages@<sha>
    - uses: actions/upload-pages-artifact@<sha>
      with: { path: site }
    - id: deployment
      uses: actions/deploy-pages@<sha>
```

The RGB workflow needs no Node, npm, Astro or Vitest step once step B is complete.

## 6. Path-conflict validation

| Path in the extracted surface | Path owned by RGB | Conflict |
|-------------------------------|-------------------|----------|
| `pt-br/library/`, `en/library/` (scaffold routes) | `library/` (generated Library) | none: different prefixes |
| none | `downloads/` | none |
| none | `library/` | none |

The rule is a fail-closed check in the deploy job: the archive must not contain `library/` or `downloads/` at its root. A later version of the surface that adds such a path fails the deploy instead of being overwritten silently.

## 7. Experiment run on 2026-10-08

Done locally, outside the RGB repository:

1. `go run ./cmd/rgb docs library --source docs --out <tmp>/library` produced 74 files (`index.html`, `search.js`, `search-index.json`, `styles.css`, `core/`).
2. The built `web/rgb-system/dist` (the archive content) was copied to `<tmp>/srv/rpg-system-rgb/`. Its top level is `_astro/`, `en/`, `pt-br/`, `favicon.svg`, `index.html`. No `library/` or `downloads/`, so the conflict check passes.
3. The generated Library and the 21 files of the baseline `public/downloads/` were mounted at `library/` and `downloads/`.
4. Served under `/rpg-system-rgb/`, every local `href` and `src` of every page answers 200, including `/library/`, the three PDF and ZIP links and all assets, with two exceptions that already exist in the RGB baseline: `/en/library/core/resolucao-de-ataque` and `/pt-br/library/core/attack-resolution` (the language switcher on Library entry pages points to a slug that does not exist in the other locale).

Result: the composition experiment succeeds. Not covered: running it in GitHub Actions, the `smoke-test-pdf` job against the composed site, and a real Pages deployment.

## 8. Migration steps and gate

Step A, deployment: change the RGB `deploy` job as in section 5, keep `web/landing` in the RGB repository as baseline and rollback, validate the real site at `https://sergiolacerda.github.io/rpg-system-rgb/` and run `smoke-test-pdf`.
Step B, cleanup: after step A is validated in production, remove `web/landing`, its lockfile, `landing-install`, `landing-check`, `landing-build`, `lint-web`, `test-web` and `audit-web` from RGB, and the Node setup from the deploy job. Go stays.

The RGB repository is changed only after all of these hold:

| Gate | Status |
|------|--------|
| A published release `rgb-vX.Y.Z` exists in `illusionist-web` | pending: tag not created |
| Download succeeds and SHA-256 validates | locally simulated only |
| The archive extracts and its structure validates | locally simulated |
| The composition experiment succeeds | done locally (section 7) |
| `release-rgb.yml` ran on GitHub | pending |

## 9. Rollback

- During step A, the kept `web/landing` and its previous `deploy` job form the rollback path: revert the deploy job to the previous commit and redeploy.
- After step B, change the pinned version (for example from `v0.1.1` back to `v0.1.0`). Historical archives stay available; nothing is rebuilt.

## 10. Risks and open points

- The deploy job gains a cross-repository download. Whether `gh release download` works with the default workflow token depends on the visibility of `illusionist-web`, which was not checked; a private repository needs a token with `contents: read` on it.
- A surface compiled for `/rpg-system-rgb` cannot be composed under another base without a new release.
- The header link `Library` goes to the generated `/library/`; the scaffold pages under `/pt-br/library/` and `/en/library/` remain reachable by URL. RGB decides whether to keep them.
- The language switcher defect on Library entry pages exists in both the old and the new landing.
- The generated Library links back with `../`, which resolves to the site root of the base; this was observed, not changed.
