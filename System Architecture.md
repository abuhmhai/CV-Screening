You are a solution architect. Design a detailed system architecture for an AI-powered recruitment platform with professional social networking features — scalable from MVP to production.

## CONSTRAINTS
- MVP phase: 1–5K users, simple deployment
- Scale phase: 50K–500K users
- Budget: Student budget (cheap VPS or cloud free tier)
- AI inference: CPU-based for MVP, GPU optional later

## DESIGN REQUIREMENTS

### 1. HIGH-LEVEL ARCHITECTURE (Mermaid C4 Diagram)
Design using:
- Client Layer: Web App (Next.js SSR/CSR), Mobile App (future)
- API Layer: NestJS API Server + Python FastAPI (AI Service)
- Data Layer: PostgreSQL + Redis + File Storage
- Infrastructure: Nginx + Docker Compose

Draw both C4 Context diagram and Component diagram.

### 2. SERVICE BOUNDARIES
Define clear responsibilities for each service:
a) Main API (NestJS):
   - Auth, User, Company, Job, Application, Feed, Social, Notification, Message
   - Communicates with AI Service via HTTP or message queue
b) AI Service (FastAPI):
   - CV Parsing, JD Parsing, Scoring, Embedding cache
   - Model loading + inference
   - Exposes: POST /screen, GET /status/:jobId
c) Background Workers (Celery):
   - AI screening queue processing
   - Email notification delivery
   - Feed fanout for users with many followers
   - Cleanup jobs (expired posts, old notifications)

### 3. DATA FLOW SEQUENCE DIAGRAMS
Draw sequence diagrams for 2 critical flows:

Flow A — Candidate Submits CV:
User → Next.js → API → PostgreSQL (save application)
→ Redis Queue (enqueue AI job)
→ AI Worker → FastAPI (parse + score)
→ PostgreSQL (save ai_screening_results)
→ WebSocket notification → User

Flow B — Feed Loading:
User → Next.js → API → PostgreSQL (query posts from connections)
→ Redis Cache (5-minute cache)
→ Response with pagination cursor

### 4. AUTHENTICATION & AUTHORIZATION
- JWT access token (15 min) + refresh token (30 days) in HttpOnly cookie
- OAuth2 flow for Google/LinkedIn login
- Role-based: candidate / recruiter / company_admin / system_admin
- Permission guards: recruiters can only view applications for their company's jobs

### 5. FILE HANDLING
- CV upload: validate MIME type (pdf/docx), max 5MB, virus scan stub
- File storage: MinIO (self-hosted) or Cloudflare R2 (free 10GB)
- CDN for avatars/images: Cloudflare CDN
- Pre-signed URLs for CV download (1-hour expiry)

### 6. REAL-TIME (WebSocket)
- Socket.io with namespaces: /notifications, /messages
- Authentication middleware validates JWT before connection
- Redis adapter for horizontal scaling (pub/sub)
- Events: new_message, notification, application_status_changed, feed_update

### 7. CACHING STRATEGY
- User session: Redis (TTL 24h)
- Feed cache: Redis sorted set per user_id (TTL 5 min, invalidate on new post)
- AI results: Redis hash by hash(cv+jd) (TTL 24h)
- Job listings: Redis page cache (TTL 10 min)
- Profile views: Redis counter (TTL 1 day)

### 8. DEPLOYMENT (Docker Compose)
Write complete docker-compose.yml for:
- nextjs (frontend)
- nestjs-api
- fastapi-ai
- celery-worker
- postgresql
- redis
- minio
- nginx (reverse proxy + SSL termination with Let's Encrypt)

Include health checks, volume mounts, and environment variables.

### 9. MONITORING (MVP Level)
- Health check endpoints for each service (/health)
- Structured JSON logging with Winston/Pino
- Error tracking: Sentry (free tier)
- Uptime monitoring: UptimeRobot (free)
- Basic metrics dashboard (optional: Grafana + Prometheus)

### 10. SCALABILITY PATH
When scaling from MVP → Production:
- Horizontal scaling: add replicas for API and AI service
- Database: read replicas for PostgreSQL
- Queue: migrate from Celery/Redis to RabbitMQ or AWS SQS
- AI inference: add GPU instance for faster inference
- CDN: CloudFront or Cloudflare for static assets
- Consider: separate search service (Elasticsearch) when FTS becomes a bottleneck

Please start by writing the complete docker-compose.yml and nginx.conf, then draw the Mermaid architecture diagram.