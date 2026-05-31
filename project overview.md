You are a senior software architect and AI specialist. I need your comprehensive guidance to design a graduation thesis project as described below.

╔══════════════════════════════════════════════════════════════╗
║  THESIS TITLE: AI-POWERED RECRUITMENT PLATFORM WITH          ║
║               PROFESSIONAL SOCIAL NETWORK (LinkedIn-style)  ║
║               AND AUTOMATED CANDIDATE SCREENING             ║
╚══════════════════════════════════════════════════════════════╝

## 1. PROBLEM STATEMENT
Vietnam's recruitment market is growing rapidly, but the candidate screening process remains manual, time-consuming, and subjective. This thesis builds a web platform combining:
- Professional social network (posts, connections, news feed) similar to LinkedIn
- Full recruitment system (job posting, applications, hiring pipeline)
- Automated AI Screening (CV analysis, fit scoring, candidate ranking)

## 2. USER PERSONAS
- Job Seeker (Candidate): find jobs, build professional profile, grow network
- Recruiter/HR: post jobs, use AI screening, manage hiring pipeline
- Admin: system administration, content moderation, analytics & reporting

## 3. TECHNOLOGY STACK
- Frontend: React 18 + Next.js 14 (App Router) + Tailwind CSS
- Backend: Node.js + NestJS (REST API + WebSocket)
- AI Service: Python 3.11 + FastAPI + sentence-transformers + spaCy
- Database: PostgreSQL 15 (primary) + Redis (cache, session, queue)
- File Storage: MinIO or AWS S3
- Search: PostgreSQL Full-Text Search or Elasticsearch
- Deployment: Docker Compose (dev) + Nginx reverse proxy

## 4. DETAILED REQUIREMENTS

### 4.1 System Architecture
- Draw overall architecture diagram (Mermaid format)
- Describe main data flows: CV submission → AI processing → recruiter views results
- Design API Gateway, JWT + OAuth2 authentication (Google, LinkedIn)
- Define services/modules: Auth, User, Job, Application, Feed, AI, Notification, Message

### 4.2 Database Schema
- Full ERD with SQL DDL (PostgreSQL)
- Main tables: users, profiles, companies, jobs, applications, ai_scores, posts, comments, connections, messages, notifications
- AI scoring schema: overall_score, skill_score, exp_score, edu_score, matched_keywords (JSONB), explanation (TEXT), processed_at

### 4.3 AI Screening Pipeline
- Pipeline: PDF/DOCX input → text extraction → NLP parsing → embedding → scoring → JSON output
- CV Parser: extract name, email, phone, skills, experience, education (Vietnamese + English support)
- JD Parser: extract skill requirements, min experience, salary range, keywords
- Scoring: cosine similarity with sentence-transformers (paraphrase-multilingual)
- Weights: skills 40% + experience 30% + education 20% + others 10%

### 4.4 Social Network Features
- News Feed with ranking algorithm (recency + engagement + graph relevance)
- User profiles: work experience timeline, education, endorsed skills
- Connections: 1st/2nd/3rd degree, "People You May Know", mutual connections
- Company pages: followers, job listings, culture posts

### 4.5 Recruitment Features
- Structured job posting form (JD, requirements, salary, location)
- Hiring pipeline: Applied → AI Screened → HR Review → Interview → Offer → Hired/Rejected
- Recruiter dashboard: AI ranking table, filter by score, Excel export
- Analytics: application volume, AI screening pass rate, time-to-hire

## 5. EXPECTED OUTPUT FORMAT
- Use Mermaid for architecture diagrams and ERD
- Use SQL code blocks for schema
- Use Python/TypeScript code blocks for implementation examples
- Clearly mark [MVP] vs [Advanced] for each feature
- Include time estimates per section (in weeks)

Please start with section 4.1 — System Architecture — and draw the overall diagram.