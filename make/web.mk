.PHONY: \
	install-web build-site build-all check-web lint-web test-web cover-web \
	preview-site dev-site ci-web

install-web:
	cd web/strategist && npm ci

build-site: install-web
	cd web/strategist && npm run build

build-all: build-site

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
