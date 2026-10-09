# Providence Selector data contract (v1)

Status: observed contract, source-cited. It was derived from the Providence
producer at an exact commit and checked against a real generated payload.

## Ownership and provenance

Providence remains the sole owner of governed data production, semantic
validation, canonical fallback and dependency validity. ILUSIONISTA owns the
static presentation surface that reads the resulting payload and only checks
the structure it needs to render.

| Item | Value |
|---|---|
| Repository | `SergioLacerda/providence` |
| Ref and commit | `origin/main` at `7bbfb67135eb0f2db2a212f65d5068b4e5090474` |
| Generator | `packages/interfaces/providence_wizard/src/providence_wizard/orchestration/wizard/selector_compiler.py` (`SelectorCompiler.build_payload`, `build_site`) |
| Item model | `.../orchestration/wizard/_selector_models.py` (`SelectorItem`) |
| Source parsing | `.../orchestration/wizard/_selector_dsl_parsing.py`, `_selector_canonical_fallback.py` |
| Selection validator | `.../orchestration/wizard/selector_bridge.py` (`validate_selector_selection`) |
| Original client | `.../templates/selector/` (`index.html`, `selector.js`, `style.css`, `site-header.*`) |
| Real payload | `web/providence-selector/compat/providence-7bbfb67/data.json`, described by `RECORD.json` in the same directory |

The Selector producer SHA is the same commit that was pinned for the landing
(`docs/architecture/providence-migration-report.md`); both were read from the
same checkout.

## Input boundary

| Input | Required | Responsibility | Failure policy in the Selector |
|---|---:|---|---|
| `data.json` | Yes | Providence-produced governed data | A missing, unreachable, malformed, unsupported or structurally invalid file is reported at the presentation boundary and nothing is rendered. The Selector does not repair it or claim to validate governance semantics. |
| `docs.index.json` | No | Optional enrichment (`documents` list) | Absence or fetch failure is silent. A body that is present but unusable produces a warning and is ignored. It never blocks boot, selection, export or import. |
| `selector-selection.json` | No | User-owned selection import and export | Compatible selections are restored. Invalid or unknown payloads are rejected with a message and leave the current selection untouched. |

Files are fetched relative to the page (`data.json`, `docs.index.json`), so the
consumer places them beside `index.html` of the Selector at composition time.

## `data.json` v1

Observed in `SelectorCompiler.build_payload()`:

```json
{ "version": "1.0", "generated_at": "<ISO-8601 UTC, seconds>", "items": [ <item>, ... ] }
```

| Field | Type | Notes |
|---|---|---|
| `version` | string | Always `"1.0"` today. The Selector accepts major version 1 (`1`, `1.0`, `1.12.3`) and rejects anything else. |
| `generated_at` | string | Generation time. Informational; not required by the Selector. |
| `items` | list | May be empty: Providence emits an empty list, with a warning on stderr, when no governance artifacts exist. |

Item (`SelectorItem.to_dict()`):

| Field | Type | Producer default | Selector rule |
|---|---|---|---|
| `id` | string | none | required, non-empty, unique |
| `title` | string | from governance metadata | required string |
| `description` | string | none (a missing description fails generation) | required string |
| `category` | string | the item type (`mandate` or `guideline`) | required string |
| `mandatory` | boolean | `true` when the source does not say | required boolean |
| `tags` | list of strings | `[<item_type>]` | required list of strings |
| `depends_on` | list of strings | `[]` | required list of strings |
| `item_type` | string | `"mandate"` | optional; defaults to `"mandate"` as the original client did; rendered as given |

Unknown fields are ignored. Semantic checks stay in Providence: on its primary path (governed
`.providence` artifacts) the producer already fails generation on duplicate
ids and on dependencies that name no item (`_validate_unique_ids`,
`_validate_dependencies`); the canonical-docs fallback path was not
inspected for the same checks. The Selector rejects
duplicate ids because the UI cannot render them, but it does not reject an
unknown dependency id: it shows a warning ("references missing dependency")
exactly as the original client did.

Dependencies are an array of item ids in `depends_on`; one dependency is a
one-element array and several are several elements. There is no dependency
status field and no canonical ordering beyond the array order.

## Selection file (`selector-selection.json`)

Written by the Selector and validated on the Providence side by
`selector_bridge.validate_selector_selection`, which requires a string
`version` and a list of strings in `selected_ids`, and treats `resolved_ids`
as defaulting to `selected_ids`:

```json
{ "version": "1.0", "selected_ids": ["..."], "resolved_ids": ["..."] }
```

`selected_ids` are the items the user ticked, sorted. `resolved_ids` add the
dependencies the Selector resolved, sorted. On import the Selector requires a
string `version` and takes `selected_ids`, falling back to `resolved_ids`;
every id must be a string that names an item.

## Observed real payload

`RECORD.json` records the payload generated from the pinned commit by running
`SelectorCompiler.build_payload()` on a git archive of that commit in a
temporary directory: 39 items (16 mandates, 23 guidelines), 7 categories, 15
optional items, `depends_on` empty for every item, version `1.0`. Because the
real payload has no dependencies, dependency behavior is covered by the
deterministic fixture (`web/providence-selector/fixtures/data.json`), not by
the real payload.

## Known limitations

- `docs.index.json` is only known to carry a `documents` list (the original
  client reads nothing else and never uses it in the UI). Its item fields were
  not specified by the original client and are not validated.
- There is no payload JSON Schema in Providence; this document is derived from
  code. A future Providence version number would need a new reading of the
  producer.
- `generated_at` varies on every generation, so a payload is not byte-stable
  across runs.

## Release boundary

The presentation artifact contains runtime assets only. It excludes
production `data.json`, `docs.index.json`, fixtures, compatibility payloads,
governance files, `.providence`, `node_modules` and baseline snapshots; the
structural gate rejects them. A consumer injects governed data at composition
time.
