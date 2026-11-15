# Server targets. The root Makefile calls these via `make -C server <target>`.
# Tools (goose, sqlc, oapi-codegen) are pinned in go.mod and run with `go tool`.

.PHONY: help dev test migrate migrate-status migration reset-password gen check

# Local Docker Postgres from ../docker-compose.yml. An exported DATABASE_URL
# wins, so no .env file is needed for local work.
LOCAL_DATABASE_URL := postgres://cadence:cadence_local_dev@localhost:5433/cadence?sslmode=disable
DATABASE_URL ?= $(LOCAL_DATABASE_URL)

OPENAPI := ../api/openapi.yaml
OAPI_CONFIG := internal/api/oapi-codegen.yaml
OAPI_OUT := internal/api/types.gen.go

# quiet runs a command, printing its output only if it fails, so a passing
# `make check` prints nothing. Usage: $(call quiet,<label>,<command>)
# (the command must not contain commas).
define quiet
	@out=$$($(2) 2>&1) || { printf '\n--- %s failed ---\n%s\n' '$(1)' "$$out"; exit 1; }
endef

help: ## List targets
	@grep -E '^[a-z-]+:.*##' $(MAKEFILE_LIST) | awk -F':.*## ' '{printf "  %-16s %s\n", $$1, $$2}'

dev: ## Run the API against local Docker Postgres (or $$DATABASE_URL)
	@DATABASE_URL='$(DATABASE_URL)' go run ./cmd/api

test: ## Run all tests with the race detector (needs `make db-up`)
	@go test -race ./...

# Migrations run only from here, never at server startup. The guard refuses
# non-local hosts so an exported hosted URL cannot be migrated by accident;
# the owner sets MIGRATE_ALLOW_REMOTE=1 deliberately for that.
migrate: ## Apply migrations to DATABASE_URL (local only unless MIGRATE_ALLOW_REMOTE=1)
	@$(call guard_local)
	@go tool goose -dir db/migrations postgres '$(DATABASE_URL)' up

migrate-status: ## Show migration status for DATABASE_URL
	@$(call guard_local)
	@go tool goose -dir db/migrations postgres '$(DATABASE_URL)' status

# Forgotten family password [I7]: prints a new random password and signs
# every device out. Same local-only guard as migrate.
reset-password: ## Reset a family's password: make reset-password email=family@example.com
	@test -n '$(email)' || { echo 'usage: make reset-password email=<family email>'; exit 1; }
	@$(call guard_local)
	@DATABASE_URL='$(DATABASE_URL)' go run ./cmd/admin reset-password -email '$(email)'

migration: ## Create a new SQL migration: make migration name=add_family
	@test -n '$(name)' || { echo 'usage: make migration name=<snake_case_name>'; exit 1; }
	@go tool goose -dir db/migrations -s create '$(name)' sql

gen: ## Regenerate sqlc queries and API types from the contract
	@go tool sqlc generate
	@go tool oapi-codegen -config $(OAPI_CONFIG) -o $(OAPI_OUT) $(OPENAPI)

# Generated code is checked by regenerating into a diff rather than into the
# tree, so `check` never rewrites files and works on uncommitted changes.
check: ## gofmt, vet, lint, tests and generated-code freshness; prints only failures
	@unformatted=$$(gofmt -l .); test -z "$$unformatted" || { printf '\n--- gofmt failed; run gofmt -w on ---\n%s\n' "$$unformatted"; exit 1; }
	$(call quiet,go vet,go vet ./...)
	$(call quiet,golangci-lint,golangci-lint run)
	$(call quiet,go test,go test -race ./...)
	$(call quiet,sqlc generated code is stale (run make gen),go tool sqlc diff)
	$(call quiet,API types are stale (run make gen),sh -c 'go tool oapi-codegen -config $(OAPI_CONFIG) $(OPENAPI) | diff -u $(OAPI_OUT) -')

define guard_local
	case '$(DATABASE_URL)' in \
	  *@localhost:*|*@localhost/*|*@127.0.0.1:*|*@127.0.0.1/*) ;; \
	  *) test '$(MIGRATE_ALLOW_REMOTE)' = 1 || { echo 'refusing: DATABASE_URL is not local (set MIGRATE_ALLOW_REMOTE=1 if intended)'; exit 1; } ;; \
	esac
endef
