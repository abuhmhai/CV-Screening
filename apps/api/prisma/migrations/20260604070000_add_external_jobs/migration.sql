-- CreateTable
CREATE TABLE "external_jobs" (
    "id" UUID NOT NULL,
    "source" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "salary" TEXT,
    "location" TEXT,
    "url" TEXT NOT NULL,
    "jd" TEXT,
    "skills" JSONB NOT NULL DEFAULT '[]',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "crawled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "external_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "external_jobs_url_key" ON "external_jobs"("url");

-- CreateIndex
CREATE INDEX "external_jobs_source_idx" ON "external_jobs"("source");

-- CreateIndex
CREATE INDEX "external_jobs_crawled_at_idx" ON "external_jobs"("crawled_at");

-- Full-text search over title + company (simple config, accent-insensitive enough for demo)
CREATE INDEX "external_jobs_title_company_search_idx" ON "external_jobs" USING gin(to_tsvector('simple', "title" || ' ' || "company"));
