.PHONY: \
	install-web build-site build-all check-web lint-web test-web cover-web \
	preview-site dev-site ci-web

install-web:
	cd web/landing && npm ci

build-site: install-web
	cd web/landing && npm run build

build-all: build-site

check-web:
	cd web/landing && npm run lint

lint-web: check-web

test-web:
	cd web/landing && npm run test

cover-web:
	cd web/landing && npm run cover

preview-site: build-site
	cd web/landing && npm run preview

dev-site: install-web
	cd web/landing && npm run dev

ci-web: install-web check-web test-web cover-web build-site
