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
	@echo "  make ci-providence Same pipeline for the Providence surface (web/providence)"
	@echo "  make build-providence Build static output in web/providence/dist (Providence target)"
	@echo "  make ci-selector  Same pipeline for the Providence Selector surface (web/providence-selector)"
	@echo "  make lint         Lint all registered web surfaces"
	@echo "  make test         Run tests for all registered web surfaces"
	@echo "  make coverage     Run coverage for all registered web surfaces"
	@echo "  make cover        Alias for make coverage"
	@echo "  make audit        Audit dependencies globally (npm audit; AUDIT_LEVEL=high by default)"
	@echo "  make vulnerabilities Alias for make audit"
	@echo "  make quality      Run lint, tests, coverage and audit globally"
