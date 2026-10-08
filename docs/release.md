# Releasing the static surface

ILUSIONISTA publishes its landing as a versioned, immutable static archive. A consumer depends on a release, never on `main`, the latest commit or the latest successful workflow run.

This document describes the contract implemented by `.github/workflows/release.yml`.

## Artifacts

Each release `vX.Y.Z` (SemVer; `v0.x.y` while the contract is being discovered) carries two files:

| File | Purpose |
|------|---------|
| `illusionist-strategist-surface-vX.Y.Z.tar.gz` | The static output of `web/landing` |
| `illusionist-strategist-surface-vX.Y.Z.tar.gz.sha256` | SHA-256 of the archive above, calculated over the final archive |

The archive entries sit at the archive root. There is no `web/landing/dist` prefix:

```text
index.html
pragmatic/
epic/
fonts/
_assets/
robots.txt
```

The version in the file name is the release tag without the leading `v`, and it equals `version` in `web/landing/package.json`.

## Consuming a release

1. **Download** both files from the GitHub Release of the chosen version.
2. **Verify** the checksum from the directory that holds both files:

   ```bash
   sha256sum -c illusionist-strategist-surface-vX.Y.Z.tar.gz.sha256
   ```

   Stop if the result is not `OK`.
3. **Extract** into an empty directory:

   ```bash
   mkdir site && tar -xzf illusionist-strategist-surface-vX.Y.Z.tar.gz -C site
   ```

4. **Publish** the extracted directory with any static host, so that it answers under `/strategist-skill/` (see [Deployment values](#deployment-values)). No Node, Astro, React or npm is needed.

## Deployment values

The source is deployment-independent, but the released build is compiled for its target consumer. The release workflow sets `ILLUSIONIST_SITE=https://sergiolacerda.github.io` and `ILLUSIONIST_BASE=/strategist-skill`, so the archive is meant to be served under `https://sergiolacerda.github.io/strategist-skill/`, with asset paths, `canonical` and `og:url` built from those two values. The consumer does not rebuild it. A prebuilt tree cannot serve two different base paths: served at the root of a host, its assets do not resolve. Another consumer builds its own variant from the tagged source by passing its own `site` and `base` at build time (see [build.md](build.md)).

## Acceptance

A release is accepted on properties of the artifact: the checksum verifies, the archive layout matches the contract above, and the extracted tree, served under `/strategist-skill/`, answers the expected pages, loads its assets from that prefix and carries canonical and `og:url` values that start with `https://sergiolacerda.github.io/strategist-skill/`. The consumer pins the exact version it publishes and never uses `latest`, `main` or a workflow run.

## Cutting a release (maintainer)

1. Set `version` in `web/landing/package.json` to the new version and merge it.
2. Push the tag `vX.Y.Z` that equals that version. The release workflow fails when they differ.
3. The workflow runs the type check, the tests and the build, then packages the output, writes the checksum and creates the GitHub Release with both files attached. Nothing is published if an earlier step fails.
4. Never move or reuse a tag. A bad release is superseded by a new patch version.

## Not covered

Signing, attestations, a universal manifest or schema, promotion channels and automatic updates of consumers are out of scope for the current contract.
