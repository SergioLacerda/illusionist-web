include make/web.mk

.DEFAULT_GOAL := help

.PHONY: help

help:
	@echo "ILUSIONISTA web targets:"
	@echo "  make install-web  Install landing dependencies with npm ci"
	@echo "  make check-web    Run Astro type/template checks"
	@echo "  make test-web     Run the landing test suite"
	@echo "  make cover-web    Run tests with coverage"
	@echo "  make build-site   Build static output in web/landing/dist"
	@echo "  make preview-site Preview the production build locally"
	@echo "  make ci-web       Install, check, test, coverage and build"
