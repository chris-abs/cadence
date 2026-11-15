.PHONY: help db-up db-down migrate gen dev-server dev-client check check-server check-client test

help: ## List targets
	@grep -E '^[a-z-]+:.*##' $(MAKEFILE_LIST) | awk -F':.*## ' '{printf "  %-14s %s\n", $$1, $$2}'

db-up: ## Start local Postgres (Docker) and wait until healthy
	@docker compose up -d --wait

db-down: ## Stop local Postgres (data is kept)
	@docker compose down

migrate: ## Apply database migrations to DATABASE_URL
	@$(MAKE) -C server migrate

gen: ## Regenerate code (sqlc, API types)
	@$(MAKE) -C server gen
	@cd client && yarn -s gen

dev-server: ## Run the API with local settings
	@$(MAKE) -C server dev

dev-client: ## Run the web client (Vite)
	@cd client && yarn -s dev

check-server: ## Format check, lint and tests for the server
	@$(MAKE) -C server check

check-client: ## Type-check, lint, tests and build for the client
	@cd client && yarn -s check

check: check-server check-client ## The quality gate: run before every commit

test: ## Run all tests
	@$(MAKE) -C server test
	@cd client && yarn -s test
