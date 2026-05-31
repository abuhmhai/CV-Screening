# AI-Powered Recruitment Platform Monorepo

Monorepo scaffold for a graduation thesis project:

- `apps/web`: Next.js 14 (App Router) frontend
- `apps/api`: NestJS backend API (REST + WebSocket-ready)
- `apps/ai-service`: FastAPI AI screening service
- `packages/ui`: shared React UI components
- `packages/types`: shared TypeScript interfaces
- `packages/config`: shared lint/format/tsconfig presets

## Prerequisites

- Docker + Docker Compose
- Node.js 20.x and npm 10.x (for local non-Docker workflow)
- Python 3.11 (for local AI service workflow)

## Environment Setup

Copy and adjust env templates before real development:

- `apps/web/.env.example`
- `apps/api/.env.example`
- `apps/ai-service/.env.example`

For local Docker development, `.env.example` files are already wired in `docker-compose.yml`.

## Run with Docker Compose

```bash
make dev
```

Services:

- Web: `http://localhost:3000`
- API: `http://localhost:4000/api/v1/health`
- AI Service: `http://localhost:8000/health`
- Nginx gateway: `http://localhost`
- MinIO console: `http://localhost:9001`
- WebSocket namespaces:
  - `ws://localhost:4000/notifications`
  - `ws://localhost:4000/messages`

Stop:

```bash
make down
```

Build only:

```bash
make build
```

Test (API sample tests):

```bash
make test
```

Prisma workflow:

```bash
npm install
npm run prisma:generate -w apps/api
npm run prisma:migrate -w apps/api
npm run prisma:seed -w apps/api
```

## Local (without Docker) - Optional

Install workspace deps:

```bash
npm install
```

Run web + api:

```bash
npm run dev
```

Run AI service separately:

```bash
cd apps/ai-service
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Run AI unit tests:

```bash
cd apps/ai-service
pytest tests -q
```

## AI Screening Flow

```
Candidate  →  POST /api/v1/applications  →  NestJS saves Application (status=APPLIED)
                  │
                  └── setImmediate (non-blocking) ──────────────────────┐
                                                                         ↓
                                                        NestJS sets status=AI_SCREENING
                                                                         │
                                                         HTTP POST /screen → FastAPI
                                                                         │
                                                         parse_cv + parse_jd + compute_match_score
                                                                         │
                                                         Prisma upserts ai_screening_results
                                                         Prisma creates notification row
                                                                         │
                                                        NestJS sets status=HR_REVIEW
                                                                         │
                                                         Redis pub/sub ──►  WebSocket /notifications
                                                                               │
                                                                         candidate browser receives
                                                                         { overallScore, grade, recommendation }
```

Recruiter can also trigger re-screen manually: `POST /api/v1/applications/:id/rescreen`

Celery worker (`celery-worker` container) handles the same pipeline asynchronously via `app.tasks.screen_cv` task — same end state: PostgreSQL row + Redis notification.

## Notes

- AI scoring endpoint is scaffolded to align with thesis requirements (`/api/v1/ai/screen` on FastAPI service path `/screen` internally).
- Redis is used for cache keying (`hash(cv + job)` concept) and Celery queue broker for async screening jobs.
- Upload hardening in AI service:
  - accepts only `pdf` / `docx`
  - max file size 5MB
- NestJS uses JWT guards + role guards for domain endpoints (`candidate`, `recruiter`, `admin`).
- Nginx routes:
  - `/` -> web
  - `/api/` -> NestJS API
  - `/ai/` -> FastAPI service
