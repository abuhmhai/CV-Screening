SHELL := /bin/sh
PHP_COMPOSE := docker compose --env-file .env.php -f docker-compose.php.yml

.PHONY: dev build test down logs seed migrate db-reset

dev:
	$(PHP_COMPOSE) up --build

build:
	$(PHP_COMPOSE) build

test:
	php apps/php/tests/run.php
	python -m pytest apps/ai-service/tests -q

down:
	$(PHP_COMPOSE) down

logs:
	$(PHP_COMPOSE) logs -f

# Database helpers
migrate:
	$(PHP_COMPOSE) exec web php bin/console.php migrate

seed:
	$(PHP_COMPOSE) exec -e SEED_PASSWORD web php bin/console.php seed

db-reset:
	@echo "Use a separate database for reset/testing; back up data before replacement."

.PHONY: legacy-dev legacy-test
legacy-dev:
	docker compose up --build

legacy-test:
	docker compose run --rm api npm run test -w apps/api
	docker compose run --rm ai-service pytest tests -q

# Quick smoke-test: demo-login then call AI screen endpoint
smoke:
	@echo "==> Checking API health"
	curl -sf http://localhost:8080/api/v1/health
	@echo "\n==> Checking AI service health"
	curl -sf http://localhost:8000/health
	@echo "\n==> Calling AI /screen"
	curl -sf -X POST http://localhost:8000/screen \
	  -H "Content-Type: application/json" \
	  -d '{"cv_data":{"raw_text":"Python FastAPI PostgreSQL Redis 3 years experience"},"jd_text":"We need Python FastAPI senior developer 2 years"}'
	@echo "\n==> All checks passed"
