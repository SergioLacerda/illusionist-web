include make/web.mk

.DEFAULT_GOAL := help

.PHONY: help

help:
	@echo "ILUSIONISTA web targets:"
	@echo "  make install-web  Install Strategist dependencies with npm ci"
	@echo "  make check-web    Run Astro type/template checks"
	@echo "  make test-web     Run the Strategist test suite"
	@echo "  make cover-web    Run tests with coverage"
	@echo "  make build-site   Build static output in web/strategist/dist"
	@echo "  make preview-site Preview the production build locally"
	@echo "  make ci-web       Install, check, test, coverage and build"
	@echo "  make ci-rgb       Same pipeline for the RGB System surface (web/rgb-system)"
	@echo "  make build-rgb    Build static output in web/rgb-system/dist"
