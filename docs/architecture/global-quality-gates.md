# Global quality gates

## Purpose

The root Make layer is intended to provide one entry point for quality checks across the supported web surfaces. It is an orchestration layer only: each subproject's `package.json` script remains the source of truth.

## Registered surfaces

Global targets cover only this explicit registry, in this order:

| Surface | Directory | Lint | Tests | Coverage |
| --- | --- | --- | --- | --- |
| Strategist | `web/strategist` | `npm run lint` | `npm run test` | `npm run cover` |
| RGB-System | `web/rgb-system` | `npm run lint` | `npm run test` | `npm run test` (coverage is included) |
| Providence | `web/providence` | `npm run lint` | `npm run test` | `npm run cover` |
| Providence Selector | `web/providence-selector` | `npm run lint` | `npm run test` | `npm run cover` |

Generated output, `node_modules`, ignored worktrees and unrelated directories are not implicit targets. Adding another surface requires an explicit registry change.

The registry lives in `make/web.mk` as `GLOBAL_SURFACE_DIRS` (directories), `GLOBAL_SURFACES` (short names, same order) and `GLOBAL_GATED_SURFACES` (the subset that ships `scripts/check-surface.mjs`). Each short name has one `global-{lint,test,coverage,audit,build}-<name>` target (and gated surfaces one `global-gate-<name>`), and the aggregate targets are expanded from those lists, so a surface is registered once and joins every gate. `make check-surfaces` (also run first by `make quality` and by the `surface-parity` CI job) runs `scripts/check-surfaces.mjs`, a dependency-free script that fails when `web/*/package.json`, the Make registry and recipes, the `ci.yml` jobs, audit matrix and structural-gate steps, this table and the README layout table list different surfaces, or when a surface with a structural gate script has no `global-build`/`global-gate` target.

## Public command contract

The planned global interface is:

- `make lint` — run linting for all registered surfaces.
- `make test` — run the package-local test command for all registered surfaces.
- `make coverage` and `make cover` — run each surface's coverage contract. RGB-System maps to its existing coverage-bearing test command until it gains a dedicated coverage script.
- `make audit` and `make vulnerabilities` — run the approved vulnerability policy for each project.
- `make check-surfaces` — verify that the registry is consistent across Make, CI, documentation and README.
- `make quality` — run the approved composite quality sequence (`check-surfaces`, `lint`, `coverage`, `audit`). `coverage` executes every test suite, so `quality` does not run `test` a second time; `make test` remains available on its own.
- `make build-all` — build every registered surface with the deployment values of its release workflow. It never runs `npm ci`; dependencies must already be installed (the `install-*` targets do that).
- `make gates` — run the structural gate (`scripts/check-surface.mjs`) of the surfaces that ship one (Providence and Providence Selector) against their existing `dist/`.
- `make ci` — `quality`, then `build-all`, then `gates`: the sequence each surface job of `.github/workflows/ci.yml` runs, plus the audit and registry checks.

Existing surface-specific targets such as `lint-rgb`, `cover-providence` and `ci-web` remain supported.

## Required behavior

Global commands should:

1. Print a stable surface label before each command.
2. Execute surfaces in the explicit registry order.
3. Preserve every nonzero exit code and identify the failing surface.
4. Avoid `|| true`, hidden failures and output parsing as a success signal.
5. Avoid installing a root dependency tree or replacing package-local scripts.

Before executing a global target, the Make layer checks that the current Node major
version matches the registered projects' `.nvmrc` files. This is a guard, not a
runtime selector: it never installs or switches Node. If registered projects require
different majors, use their surface-specific targets or CI's isolated jobs.

The initial proposal uses sequential, fail-fast execution for deterministic output. An aggregate-report mode would require a separate decision.

## Vulnerability policy decision

The global `make audit` target uses npm's built-in audit for each registered project. It defaults to `npm audit --audit-level=high`; the threshold can be overridden deliberately with `AUDIT_LEVEL=critical`, for example. Development dependencies remain included because npm audit is not invoked with an omit flag.

The repository policy documents:

- scanner and exact command;
- blocking severity threshold;
- whether development dependencies are included;
- network/offline expectations; and
- whether findings block the aggregate quality target.

Audit findings remain visible and block the target at the selected threshold. The command requires the normal npm registry/network behavior; an offline scanner mode is not configured.

CI applies the same policy through the `audit` job of `.github/workflows/ci.yml`: one matrix entry per surface, run under that surface's `.nvmrc`, executing `npm audit --audit-level=high` against the lockfile (no install, so no lifecycle scripts run). It runs on every push and pull request and on a weekly schedule, so a newly published advisory also surfaces on an idle branch. A registry error fails the job; it is never reported as a pass. There is no allowlist tooling. An advisory without an available fix is handled in the pull request that must unblock the build: pin or override the dependency, or raise `AUDIT_LEVEL` for that run with the justification and an expiry recorded in the pull request description.

## Runtime and CI boundary

Each command runs inside the selected subproject and respects its package manager, lockfile, `.nvmrc` and engine declaration. The root Make layer does not select Node versions.

CI should remain split into separate surface jobs because it owns runtime setup, caching, artifact uploads and the base-path surface gate of Providence and the Providence Selector. A future CI consolidation must demonstrate equivalent runtime and failure behavior before replacing those jobs.

## Shell compatibility

The current Make recipes use POSIX shell constructs such as `cd ... &&` and inline environment assignment. GNU Make with a compatible shell is therefore the documented baseline until a Windows-compatible implementation is tested; cross-platform support must not be implied without validation.

## Implementation status

The global targets are implemented in the root Make layer. They use an explicit
four-surface registry, labeled sequential recipes, nonzero failure propagation,
RGB-System's coverage-through-test contract, and the configurable `AUDIT_LEVEL`
policy described above. A runtime preflight prevents the aggregate commands from
running under a Node major that does not match the registered `.nvmrc` files, and
`make check-surfaces` prevents the registry from drifting from the repository.

Validation completed:

- Strategist lint: 0 errors, 0 warnings, 0 hints;
- Providence lint: 0 errors, 0 warnings, 0 hints;
- Strategist tests: 91 passed;
- Providence tests: 80 passed;
- Strategist coverage: 96.52% statements, 93.90% branches;
- Providence coverage: 98.50% statements, 95.40% branches;
- Make dry-runs and missing-command failure propagation passed.

The full aggregate lint was not run under the current Node 24.18.0 environment:
RGB-System requires Node 26 and the preflight correctly stops with an actionable
message. The audit endpoint also returned a registry error in this environment;
the target itself remains configured and fail-closed.
