.PHONY: \
	install-web build-site build-all check-web lint-web test-web cover-web \
	preview-site dev-site ci-web

install-web:
	cd web/strategist && npm ci

build-site: install-web
	cd web/strategist && npm run build

check-web:
	cd web/strategist && npm run lint

lint-web: check-web

test-web:
	cd web/strategist && npm run test

cover-web:
	cd web/strategist && npm run cover

preview-site: build-site
	cd web/strategist && npm run preview

dev-site: install-web
	cd web/strategist && npm run dev

ci-web: install-web check-web test-web cover-web build-site

# RGB System surface (web/rgb-system)
.PHONY: install-rgb check-rgb test-rgb build-rgb preview-rgb dev-rgb ci-rgb

install-rgb:
	cd web/rgb-system && npm ci

build-rgb: install-rgb
	cd web/rgb-system && npm run build

check-rgb:
	cd web/rgb-system && npm run lint

test-rgb:
	cd web/rgb-system && npm run test

preview-rgb: build-rgb
	cd web/rgb-system && npm run preview

dev-rgb: install-rgb
	cd web/rgb-system && npm run dev

ci-rgb: install-rgb check-rgb test-rgb build-rgb

# Providence surface (web/providence)
.PHONY: install-providence check-providence test-providence cover-providence build-providence gate-providence preview-providence dev-providence ci-providence

install-providence:
	cd web/providence && npm ci

build-providence: install-providence
	cd web/providence && ILLUSIONIST_SITE=https://sergiolacerda.github.io ILLUSIONIST_BASE=/providence npm run build

check-providence:
	cd web/providence && npm run lint

test-providence:
	cd web/providence && npm run test

cover-providence:
	cd web/providence && npm run cover

gate-providence:
	cd web/providence && ILLUSIONIST_BASE=/providence node scripts/check-surface.mjs dist /providence

preview-providence: build-providence
	cd web/providence && npm run preview

dev-providence: install-providence
	cd web/providence && npm run dev

ci-providence: install-providence check-providence cover-providence build-providence gate-providence

# Global quality gates. Keep this registry explicit: package-local scripts remain
# authoritative, and generated/vendored directories are never discovered implicitly.
# GLOBAL_SURFACE_DIRS and GLOBAL_SURFACES list the same surfaces in the same order;
# `make check-surfaces` fails when they drift from web/*/package.json, the global
# recipes, ci.yml or the documentation.
NPM ?= npm
AUDIT_LEVEL ?= high
GLOBAL_SURFACE_DIRS := web/strategist web/rgb-system web/providence web/providence-selector
GLOBAL_SURFACES := strategist rgb providence selector
# Surfaces that ship a structural gate (web/<dir>/scripts/check-surface.mjs).
GLOBAL_GATED_SURFACES := providence selector

.PHONY: lint test coverage cover audit vulnerabilities quality check-surfaces \
	build-all gates ci global-runtime \
	$(foreach gate,lint test coverage audit build,$(addprefix global-$(gate)-,$(GLOBAL_SURFACES))) \
	$(addprefix global-gate-,$(GLOBAL_GATED_SURFACES))

check-surfaces:
	@node scripts/check-surfaces.mjs

global-runtime:
	@node -e "const fs=require('fs'); const projects='$(GLOBAL_SURFACE_DIRS)'.split(' '); const actual=process.versions.node.split('.')[0]; const expected=[...new Set(projects.map(p=>fs.readFileSync(p+'/.nvmrc','utf8').trim().match(/^[0-9]+/)?.[0]).filter(Boolean))]; if(expected.length!==1 || actual!==expected[0]) { console.error('Global quality targets require Node '+expected.join(' or ')+' from the registered .nvmrc files; current runtime is Node '+process.versions.node+'. Use the matching runtime or run a surface-specific target.'); process.exit(1); } console.log('[runtime] Node '+process.versions.node+' matches the registered surfaces');"

lint: global-runtime $(addprefix global-lint-,$(GLOBAL_SURFACES))

global-lint-strategist:
	@echo "[strategist] lint"
	cd web/strategist && $(NPM) run lint

global-lint-rgb:
	@echo "[rgb-system] lint"
	cd web/rgb-system && $(NPM) run lint

global-lint-providence:
	@echo "[providence] lint"
	cd web/providence && $(NPM) run lint

global-lint-selector:
	@echo "[providence-selector] lint"
	cd web/providence-selector && $(NPM) run lint

test: global-runtime $(addprefix global-test-,$(GLOBAL_SURFACES))

global-test-strategist:
	@echo "[strategist] test"
	cd web/strategist && $(NPM) run test

global-test-rgb:
	@echo "[rgb-system] test (includes coverage)"
	cd web/rgb-system && $(NPM) run test

global-test-providence:
	@echo "[providence] test"
	cd web/providence && $(NPM) run test

global-test-selector:
	@echo "[providence-selector] test"
	cd web/providence-selector && $(NPM) run test

coverage: global-runtime $(addprefix global-coverage-,$(GLOBAL_SURFACES))

cover: coverage

global-coverage-strategist:
	@echo "[strategist] coverage"
	cd web/strategist && $(NPM) run cover

# RGB-System has no separate cover script; its test script already runs Vitest
# with coverage enabled, so preserve that local contract here.
global-coverage-rgb:
	@echo "[rgb-system] coverage via test"
	cd web/rgb-system && $(NPM) run test

global-coverage-providence:
	@echo "[providence] coverage"
	cd web/providence && $(NPM) run cover

global-coverage-selector:
	@echo "[providence-selector] coverage"
	cd web/providence-selector && $(NPM) run cover

audit: global-runtime $(addprefix global-audit-,$(GLOBAL_SURFACES))

vulnerabilities: audit

global-audit-strategist:
	@echo "[strategist] audit (threshold=$(AUDIT_LEVEL))"
	cd web/strategist && $(NPM) audit --audit-level=$(AUDIT_LEVEL)

global-audit-rgb:
	@echo "[rgb-system] audit (threshold=$(AUDIT_LEVEL))"
	cd web/rgb-system && $(NPM) audit --audit-level=$(AUDIT_LEVEL)

global-audit-providence:
	@echo "[providence] audit (threshold=$(AUDIT_LEVEL))"
	cd web/providence && $(NPM) audit --audit-level=$(AUDIT_LEVEL)

global-audit-selector:
	@echo "[providence-selector] audit (threshold=$(AUDIT_LEVEL))"
	cd web/providence-selector && $(NPM) audit --audit-level=$(AUDIT_LEVEL)

# Build and structural gates. These reuse the deployment values of the per-surface
# build-* targets and release workflows, but never run `npm ci`: dependencies are
# whatever the surface already has installed (the install-* targets install them).
build-all: global-runtime $(addprefix global-build-,$(GLOBAL_SURFACES))

global-build-strategist:
	@echo "[strategist] build"
	cd web/strategist && $(NPM) run build

global-build-rgb:
	@echo "[rgb-system] build"
	cd web/rgb-system && $(NPM) run build

global-build-providence:
	@echo "[providence] build"
	cd web/providence && ILLUSIONIST_SITE=https://sergiolacerda.github.io ILLUSIONIST_BASE=/providence $(NPM) run build

global-build-selector:
	@echo "[providence-selector] build"
	cd web/providence-selector && ILLUSIONIST_SITE=https://sergiolacerda.github.io ILLUSIONIST_BASE=/providence/selector $(NPM) run build

gates: global-runtime $(addprefix global-gate-,$(GLOBAL_GATED_SURFACES))

global-gate-providence:
	@echo "[providence] structural gate"
	cd web/providence && ILLUSIONIST_BASE=/providence node scripts/check-surface.mjs dist /providence

global-gate-selector:
	@echo "[providence-selector] structural gate"
	cd web/providence-selector && ILLUSIONIST_BASE=/providence/selector node scripts/check-surface.mjs dist /providence/selector

# Prerequisites are intentionally sequential and phony: make stops on the first
# nonzero command and preserves the failing surface's exit status. The registry
# parity check runs first so a surface missing from a gate is reported before any
# gate executes. `coverage` already runs every test suite, so `quality` does not
# also run `test`; `make test` remains available on its own.
quality: check-surfaces lint coverage audit

# Same sequence as .github/workflows/ci.yml for every surface: the quality gates,
# then the production build and the structural gates. Install dependencies first
# (for example `make install-web install-rgb install-providence install-selector`).
ci: quality build-all gates

# Providence Selector surface (web/providence-selector)
.PHONY: install-selector check-selector test-selector cover-selector build-selector gate-selector preview-selector dev-selector ci-selector

install-selector:
	cd web/providence-selector && npm ci

build-selector: install-selector
	cd web/providence-selector && ILLUSIONIST_SITE=https://sergiolacerda.github.io ILLUSIONIST_BASE=/providence/selector npm run build

check-selector:
	cd web/providence-selector && npm run lint

test-selector:
	cd web/providence-selector && npm run test

cover-selector:
	cd web/providence-selector && npm run cover

gate-selector:
	cd web/providence-selector && node scripts/check-surface.mjs dist /providence/selector

preview-selector: build-selector
	cd web/providence-selector && npm run preview

dev-selector: install-selector
	cd web/providence-selector && npm run dev

ci-selector: install-selector check-selector cover-selector build-selector gate-selector
