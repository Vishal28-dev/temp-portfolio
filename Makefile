.DEFAULT_GOAL := help
SHELL := /bin/bash

COMPOSE      := docker compose
COMPOSE_PROD := docker compose -f docker-compose.yml -f docker-compose.prod.yml

# ------------------------------------------------------------------
#  Primary
# ------------------------------------------------------------------

.PHONY: up
up: env ## Build + start the whole stack (mongo, backend, frontend) in Docker
	$(COMPOSE) up -d --build
	@$(MAKE) --no-print-directory wait
	@$(MAKE) --no-print-directory urls

.PHONY: down
down: ## Stop and remove all containers + network (data volume kept)
	$(COMPOSE) down --remove-orphans

.PHONY: restart
restart: down up ## Full restart

# ------------------------------------------------------------------
#  Production parity
# ------------------------------------------------------------------

.PHONY: prod-up
prod-up: env ## Build + start the production images (nginx-served frontend)
	$(COMPOSE_PROD) up -d --build
	@$(MAKE) --no-print-directory wait
	@echo ""
	@echo "  frontend  http://localhost:$$(grep -E '^FRONTEND_PROD_PORT=' .env | cut -d= -f2)"
	@echo "  api       http://localhost:$$(grep -E '^BACKEND_PORT=' .env | cut -d= -f2)/api/v1/health"
	@echo ""

.PHONY: prod-down
prod-down: ## Stop the production stack
	$(COMPOSE_PROD) down --remove-orphans

# ------------------------------------------------------------------
#  Data
# ------------------------------------------------------------------

.PHONY: seed
seed: ## Seed MongoDB with profile, skills, experience and the admin user
	$(COMPOSE) exec -T backend npm run seed

.PHONY: seed-fresh
seed-fresh: ## Wipe every collection, then reseed
	$(COMPOSE) exec -T backend npm run seed -- --fresh

.PHONY: mongo-shell
mongo-shell: ## Open a mongosh session against the app database
	$(COMPOSE) exec mongo sh -lc 'mongosh "mongodb://$$MONGO_INITDB_ROOT_USERNAME:$$MONGO_INITDB_ROOT_PASSWORD@localhost:27017/$$MONGO_INITDB_DATABASE?authSource=admin"'

.PHONY: db-export
db-export: ## Dump the database to ./backup
	@mkdir -p backup
	$(COMPOSE) exec -T mongo sh -lc 'mongodump --uri="mongodb://$$MONGO_INITDB_ROOT_USERNAME:$$MONGO_INITDB_ROOT_PASSWORD@localhost:27017/$$MONGO_INITDB_DATABASE?authSource=admin" --archive' > backup/portfolio-$$(date +%Y%m%d-%H%M%S).archive
	@echo "  → wrote backup/"

# ------------------------------------------------------------------
#  Inspect
# ------------------------------------------------------------------

.PHONY: logs
logs: ## Tail logs from every service
	$(COMPOSE) logs -f --tail=80

.PHONY: logs-api
logs-api: ## Tail backend logs only
	$(COMPOSE) logs -f --tail=120 backend

.PHONY: logs-web
logs-web: ## Tail frontend logs only
	$(COMPOSE) logs -f --tail=120 frontend

.PHONY: ps
ps: ## Show container status
	$(COMPOSE) ps

.PHONY: health
health: ## Curl the API health endpoint
	@curl -fsS http://localhost:$$(grep -E '^BACKEND_PORT=' .env | cut -d= -f2)/api/v1/health | python3 -m json.tool || echo "  API not responding"

.PHONY: sh-api
sh-api: ## Shell into the backend container
	$(COMPOSE) exec backend sh

.PHONY: sh-web
sh-web: ## Shell into the frontend container
	$(COMPOSE) exec frontend sh

# ------------------------------------------------------------------
#  Housekeeping
# ------------------------------------------------------------------

.PHONY: env
env: ## Create .env from .env.example with freshly generated secrets
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		python3 scripts/gen-secrets.py .env; \
		echo "  → generated .env with fresh secrets"; \
	fi

.PHONY: wait
wait: ## Block until the API reports healthy
	@printf "  waiting for the stack"
	@port=$$(grep -E '^BACKEND_PORT=' .env | cut -d= -f2); \
	for i in $$(seq 1 60); do \
		if curl -fsS "http://localhost:$$port/api/v1/health" >/dev/null 2>&1; then echo " ✓"; exit 0; fi; \
		printf "."; sleep 2; \
	done; echo " ✗"; echo "  API did not come up — try: make logs-api"; exit 1

.PHONY: urls
urls:
	@fe=$$(grep -E '^FRONTEND_PORT=' .env | cut -d= -f2); be=$$(grep -E '^BACKEND_PORT=' .env | cut -d= -f2); \
	echo ""; \
	echo "  portfolio   http://localhost:$$fe"; \
	echo "  admin       http://localhost:$$fe/admin"; \
	echo "  api         http://localhost:$$be/api/v1"; \
	echo "  health      http://localhost:$$be/api/v1/health"; \
	echo ""

.PHONY: clean
clean: ## Remove containers, network AND the database volume (destructive)
	$(COMPOSE) down -v --remove-orphans
	@echo "  → volumes removed"

.PHONY: nuke
nuke: clean ## clean + drop built images
	-docker image rm $$(docker images -q '$(shell grep -E '^COMPOSE_PROJECT_NAME=' .env 2>/dev/null | cut -d= -f2)*' 2>/dev/null) 2>/dev/null || true

.PHONY: help
help: ## Show this help
	@echo ""
	@echo "  Vishal — portfolio"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}'
	@echo ""
