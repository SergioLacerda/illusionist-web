# Providence Selector migration report

Status: producer implementation done and verified locally on 2026-10-09 (Node 24.18.0); the release workflow has not run on GitHub and no release exists. Sections 1 to 9 are the approved plan and its open questions as written; section 10 records what was observed and built.

This report records the IA-first boundary for moving Selector presentation to
ILUSIONISTA. It deliberately separates observed local evidence, decisions, and
questions that still require the Providence repository. It does not claim that
the Selector client or release artifact has already been implemented.

## 1. Objective and ownership

The target state is an independently buildable ILUSIONISTA Selector surface
that presents Providence-produced data. Providence keeps ownership of governed
data generation, semantic validation, canonical fallback, and dependency
validity. Providence consumer migration is a later wave.

The sequence is:

`observe → discover contract → classify → replicate → fixture-test → prove independence → package → migrate consumer`

Only the producer-side documentation and contract boundary are materialized by
this approved execution. No Providence source or consumer behavior is changed.

## 2. Evidence and provenance

### Observed locally

- `web/providence` is an existing ILUSIONISTA Providence landing client.
- `base_providence/landing` is a raw, ephemeral landing baseline and is not a
  Selector contract.
- The requested Selector is a separate presentation/runtime artifact from the
  landing build.
- `data.json` is the required Selector input; `docs.index.json` is optional
  enrichment.
- The existing migration report records the landing baseline at Providence
  `origin/main` SHA `7bbfb67135eb0f2db2a212f65d5068b4e5090474`.

### Not yet observed

The workspace does not contain the Providence SelectorCompiler, SelectorItem
model, serializer, validators, Selector tests, or a real generated Selector
payload. Therefore the exact field contract, defaults, dependency encoding,
selection version, and compatibility behavior remain unresolved.

The landing SHA above must not be presented as the Selector producer SHA. A
follow-up discovery step must pin the Providence repository and exact commit
that generated the real payload used for compatibility evidence.

## 3. Responsibility matrix

| Concern | Providence | ILUSIONISTA Selector |
|---|---|---|
| Governed data generation | Owns | Consumes |
| Semantic validation and canonical fallback | Owns | Does not reimplement |
| `data.json` production | Owns | Reads at the presentation boundary |
| Documentation index | May produce | Treats `docs.index.json` as optional enrichment |
| Search, filters, display, warnings, persistence, theme | Existing behavior/source of truth to observe | Presents and tests the observed behavior |
| Selection import/export | Defines compatibility to preserve | Reads/writes compatible `selector-selection.json` |
| Packaging and static release | Future consumer composition | Owns independent, data-free presentation artifact |
| Consumer wiring and deployment | Later migration wave | Not changed in this wave |

## 4. Contract and behavior

The Selector boots from a supported `data.json` with a valid items collection.
It must fail clearly when the file is missing, malformed, unsupported, or
structurally invalid. It must continue to boot and support core behavior when
`docs.index.json` is absent.

Behavior to preserve before any visual redesign:

- bilingual UI;
- search and category filters;
- mandatory/optional and item-type display;
- dependency presentation and resolution UX;
- warnings, persistence, clear, and theme behavior;
- compatible selection import/export.

The Selector can render dependency effects but cannot become the authority for
governance semantics. Unknown or invalid imported IDs receive a clear,
non-destructive user-facing result.

The field-level contract is documented separately in
[`providence-selector-data-v1.md`](../contracts/providence-selector-data-v1.md)
and remains provisional until its source evidence is pinned.

## 5. Fixtures and tests

The independent client must use deterministic local fixtures for development
and tests. The fixture should cover mandatory and optional items, categories,
tags, mandates, guidelines, warnings, and single/multiple dependencies.

Required evidence before consumer migration:

1. Contract tests for accepted and rejected `data.json` cases.
2. Behavior tests for the preserved interaction set.
3. Optional-index tests proving that missing `docs.index.json` is non-fatal.
4. Import/export tests including unknown and invalid identifiers.
5. A controlled compatibility test against one real payload from a pinned
   Providence commit.
6. A composition simulation that extracts the artifact into an empty location,
   injects fixture data, and serves it without a Providence checkout/runtime.

The tests listed here exist now; see section 10.

## 6. Build and release gates

The Selector must install, lint, test, build, and package independently of
Providence, Python, `uv`, `.providence`, MkDocs, Providence packages, and the
GitHub API.

The release artifact must contain only presentation/runtime assets and required
metadata. It must exclude production `data.json`, `docs.index.json`, fixtures,
governance files, `.providence`, `node_modules`, and baseline snapshots.

Packaging must normalize archive ordering and metadata, emit a SHA-256, and
self-verify. Repeating the package operation from the same source and version
must produce the same archive and checksum.

## 7. Deferred consumer wave

The following remain explicitly outside this producer wave:

- Providence CI, SelectorCompiler, template copying, data generation, Docs,
  MkDocs, deployment, and consumer composition changes;
- migration of existing Providence behavior to the new artifact;
- removal or renaming of Providence-owned producer code;
- a generic multi-surface framework, runtime/API dependency, or shared
  abstraction without evidence of identical responsibility.

The consumer wave may start only after the contract, fixture tests,
compatibility evidence, independent composition simulation, structural release
gate, deterministic packaging, and release coordinates are complete.

## 8. Open questions and risks

| Question/risk | Required resolution |
|---|---|
| Exact Selector producer source | Pin repository, commit, generator, serializer, validators, tests, and real payload. |
| Field-level compatibility | Promote the discovery contract only after every field/default is source-cited. |
| Selection format version | Confirm the existing `selector-selection.json` schema and unknown-ID behavior. |
| Release versioning | Choose independently pinned or grouped versioning after inspecting ILUSIONISTA release policy. |
| Shared header primitive | Compare responsibilities and assets before extracting; do not share with MkDocs by default. |
| Data leakage | Make archive structure checks fail before publication when governed data or fixtures appear. |

## 9. Conclusion

The migration is well-bounded as a producer-first effort: Providence remains
the semantic authority while ILUSIONISTA can own a separately packaged
presentation surface. The decisive next evidence is external to the current
workspace—the pinned Providence Selector implementation and a real generated
payload. Until that evidence is captured, implementation must not invent the
data schema or claim compatibility.

## 10. Implementation results (2026-10-09)

### Observed facts, with sources

The Providence repository was available next to this one. All Providence
facts come from `origin/main` at `7bbfb67135eb0f2db2a212f65d5068b4e5090474`,
read from a git archive of that commit. The contract is in
[`providence-selector-data-v1.md`](../contracts/providence-selector-data-v1.md).

- The compiler (`selector_compiler.py`) writes `data.json` as
  `{version "1.0", generated_at, items}` and copies five template assets
  (`index.html`, `selector.js`, `style.css`, `site-header.js`, `site-header.css`).
- A real payload was generated from that commit with
  `SelectorCompiler.build_payload()` in a temporary directory: 39 items (16
  mandates, 23 guidelines), 7 categories, 15 optional items, no dependencies.
- The original client is vanilla JavaScript. It never uses `docs.index.json`
  beyond loading it, and its error handling of `data.json` was `payload.items || []`
  with no structural check.
- The header assets of the Selector and of the Providence landing are the same
  file apart from header comments (and CRLF line endings in the landing's CSS).

### What was built

`web/providence-selector/` (package `illusionist-providence-selector`), an
independent Astro project that renders one static page and a typed
TypeScript client. It was written from the original behavior, not copied:

- `contract.ts` checks only the structure the UI needs (and rejects unsupported
  versions, malformed items and duplicate ids); `resolve.ts` has the dependency
  resolution and filters; `app.ts` is the UI controller; `page.ts` wires the shared
  header and the browser APIs.
- Preserved: bilingual UI (`?lang=pt`), search, category filters, item type and
  mandatory/optional display, dependency display and resolution warnings,
  persistence (`sdd-selector`), clear, theme (`sdd-theme`), import and export
  (`selector-selection.json`, version `1.0`).
- Deliberate differences from the original client:
  1. `data.json` is checked structurally and refused with a message when
     unsupported or malformed (the original rendered whatever `items` held).
  2. Importing an invalid or unknown selection no longer clears the current
     selection first (the original cleared it before failing).
  3. A `docs.index.json` that is present but unusable shows a warning; absence stays
     silent (the original ignored every failure).
  4. TypeScript modules and tests instead of one script; the header, stylesheet
     and markup are the original's.
  5. The Google Fonts `@import` in `style.css` is kept as shipped.
- Fixtures: `fixtures/data.json` (mandates and guidelines, mandatory and
  optional, categories, tags, single and multiple dependencies),
  `fixtures/docs.index.json`, `fixtures/selection.json`. The dev server serves
  them; the build never includes them.
- Compatibility evidence: `compat/providence-7bbfb67/` holds the real payload and
  `RECORD.json` (Providence repository and SHA, payload SHA-256 and shape, contract
  version `1.0`, Selector package and version `0.1.0`, outcome `pass`); `compat.test.ts`
  checks the record against the payload and runs the Selector on it.

### Results

| Check | Result |
|---|---|
| `npm run lint` (`astro check`) | 0 errors, 0 warnings, 0 hints |
| Tests | 9 files, 162 passed |
| Coverage (thresholds 90) | 98.4 statements, 94.2 branches, 100 functions, 98.8 lines |
| Build for `/providence/selector` | 1 page; output is `index.html`, `_astro/*.js`, `_astro/*.css`, `site-header.js`, `site-header.css` |
| Structural gate | passes; it rejects `data.json` and `docs.index.json` at any depth, fixtures, compat payloads, governance files, sources and `node_modules`, and any local reference outside the base |
| Determinism | packing the output twice with the workflow options gives the same SHA-256 |
| Consumer simulation | the archive was extracted into an empty `providence/selector/`, fixtures were injected as `data.json` and `docs.index.json`, and it was served over HTTP: the page, assets and both data files answered 200. Headless Edge then loaded the page: 5 cards, 5 category filters, shared header mounted (`data-nav="landing"`, links `../`, `../docs/`, `../selector/`), light theme, and the `?lang=pt` UI |
| Independence | no Providence checkout, Python, `uv`, `.providence`, MkDocs or GitHub API is used by install, lint, test, build or package |

### Header primitive (task 1.3)

The Selector header (`site-header.js` and `.css`) and the landing header in
`web/providence/public/shared/` have the same content, so the responsibility
is identical and the duplication is real. They are not extracted: a shared
package would couple two independently released surfaces, and MkDocs keeps its
own copy under Providence. Recorded as an observation for the owner.

### Release and versioning decision

Following the independent-release policy decided for the RGB and Providence
surfaces: tag `providence-selector-vX.Y.Z`, workflow
`release-providence-selector.yml`, archive
`illusionist-providence-selector-surface-vX.Y.Z.tar.gz` with a `.sha256`,
built with `ILLUSIONIST_SITE=https://sergiolacerda.github.io` and
`ILLUSIONIST_BASE=/providence/selector`. The tag does not match the
`providence-v*` trigger of the landing release, and the reverse.

### Not done

- No release was published (task 4.4): the workflow has never run on GitHub
  and `.nvmrc` (26) was not exercised locally (Node 24.18.0).
- Nothing in Providence was changed, as required (task 5.1). The consumer wave
  needs: the release coordinates above, Providence copying the artifact to
  `/selector/` instead of its own templates, injecting `data.json` (and
  optionally `docs.index.json`) beside `index.html`, and the same base
  (`/providence/selector`) in its composition (task 5.2).
- Pixel-level visual comparison with the original client was not done; the
  stylesheet and markup are the original's, and behavior is covered by tests and
  one headless-browser load.

