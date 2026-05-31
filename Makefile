SHELL := /bin/sh

.PHONY: dev build test down logs seed migrate db-reset

dev:
	docker compose up --build

build:
	docker compose build

test:
	docker compose run --rm api npm run test -w apps/api
	docker compose run --rm ai-service pytest tests -q

down:
	docker compose down

logs:
	docker compose logs -f

# Database helpers
migrate:
	npm run prisma:migrate -w apps/api

seed:
	npm run prisma:seed -w apps/api

db-reset:
	npm run prisma:migrate -w apps/api -- --force-reset && npm run prisma:seed -w apps/api

# Quick smoke-test: demo-login then call AI screen endpoint
smoke:
	@echo "==> Checking API health"
	curl -sf http://localhost:4000/api/v1/health
	@echo "\n==> Checking AI service health"
	curl -sf http://localhost:8000/health
	@echo "\n==> Calling AI /screen"
	curl -sf -X POST http://localhost:8000/screen \
	  -H "Content-Type: application/json" \
	  -d '{"cv_data":{"raw_text":"Python FastAPI PostgreSQL Redis 3 years experience"},"jd_text":"We need Python FastAPI senior developer 2 years"}'
	@echo "\n==> All checks passed"
