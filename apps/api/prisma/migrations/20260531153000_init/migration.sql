-- Create enums
CREATE TYPE "UserRole" AS ENUM ('CANDIDATE', 'RECRUITER', 'ADMIN');
CREATE TYPE "SkillLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');
CREATE TYPE "CompanyMemberRole" AS ENUM ('OWNER', 'ADMIN', 'RECRUITER');
CREATE TYPE "JobStatus" AS ENUM ('ACTIVE', 'CLOSED', 'DRAFT');
CREATE TYPE "ApplicationStatus" AS ENUM ('APPLIED', 'AI_SCREENING', 'HR_REVIEW', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED');
CREATE TYPE "PostVisibility" AS ENUM ('PUBLIC', 'CONNECTIONS', 'PRIVATE');
CREATE TYPE "ReactionTargetType" AS ENUM ('POST', 'COMMENT');
CREATE TYPE "ReactionType" AS ENUM ('LIKE', 'CELEBRATE', 'SUPPORT', 'INSIGHTFUL');
CREATE TYPE "ConnectionStatus" AS ENUM ('PENDING', 'ACCEPTED', 'BLOCKED');
CREATE TYPE "ConversationType" AS ENUM ('DIRECT', 'GROUP');

-- Create tables
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "user_profiles" (
    "user_id" UUID NOT NULL,
    "full_name" TEXT NOT NULL,
    "headline" TEXT,
    "about" TEXT,
    "avatar_url" TEXT,
    "cover_url" TEXT,
    "location" TEXT,
    "profile_completeness" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("user_id")
);

CREATE TABLE "work_experiences" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "company" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    CONSTRAINT "work_experiences_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "educations" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "school" TEXT NOT NULL,
    "degree" TEXT NOT NULL,
    "major" TEXT,
    "gpa" DECIMAL(3,2),
    "start_year" INTEGER NOT NULL,
    "end_year" INTEGER,
    CONSTRAINT "educations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "skills" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "user_skills" (
    "user_id" UUID NOT NULL,
    "skill_id" UUID NOT NULL,
    "level" "SkillLevel" NOT NULL,
    "years_exp" DECIMAL(4,1),
    CONSTRAINT "user_skills_pkey" PRIMARY KEY ("user_id","skill_id")
);

CREATE TABLE "skill_endorsements" (
    "endorser_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "skill_id" UUID NOT NULL,
    CONSTRAINT "skill_endorsements_pkey" PRIMARY KEY ("endorser_id","user_id","skill_id")
);

CREATE TABLE "cv_files" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_size" BIGINT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "cv_files_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "companies" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo_url" TEXT,
    "industry" TEXT,
    "size_range" TEXT,
    "description" TEXT,
    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "company_members" (
    "company_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "CompanyMemberRole" NOT NULL,
    CONSTRAINT "company_members_pkey" PRIMARY KEY ("company_id","user_id")
);

CREATE TABLE "jobs" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "created_by" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "job_type" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "min_salary" INTEGER,
    "max_salary" INTEGER,
    "location" TEXT,
    "required_skills" JSONB NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'DRAFT',
    "expires_at" TIMESTAMP(3),
    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "applications" (
    "id" UUID NOT NULL,
    "job_id" UUID NOT NULL,
    "candidate_id" UUID NOT NULL,
    "cv_file_id" UUID NOT NULL,
    "cover_letter" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'APPLIED',
    "applied_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ai_screening_results" (
    "id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "overall_score" DECIMAL(5,2) NOT NULL,
    "skill_score" DECIMAL(5,2) NOT NULL,
    "experience_score" DECIMAL(5,2) NOT NULL,
    "education_score" DECIMAL(5,2) NOT NULL,
    "other_score" DECIMAL(5,2) NOT NULL,
    "grade" TEXT NOT NULL,
    "matched_skills" JSONB NOT NULL,
    "missing_skills" JSONB NOT NULL,
    "strengths" JSONB NOT NULL,
    "concerns" JSONB NOT NULL,
    "explanation" TEXT NOT NULL,
    "model_version" TEXT NOT NULL,
    "processing_time_ms" INTEGER NOT NULL,
    CONSTRAINT "ai_screening_results_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "application_status_history" (
    "application_id" UUID NOT NULL,
    "from_status" "ApplicationStatus",
    "to_status" "ApplicationStatus" NOT NULL,
    "changed_by" UUID NOT NULL,
    "note" TEXT,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "application_status_history_pkey" PRIMARY KEY ("application_id","changed_at","to_status")
);

CREATE TABLE "posts" (
    "id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "company_id" UUID,
    "content" TEXT NOT NULL,
    "media_urls" JSONB,
    "visibility" "PostVisibility" NOT NULL DEFAULT 'PUBLIC',
    "like_count" INTEGER NOT NULL DEFAULT 0,
    "comment_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "comments" (
    "id" UUID NOT NULL,
    "post_id" UUID NOT NULL,
    "parent_id" UUID,
    "author_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "reactions" (
    "user_id" UUID NOT NULL,
    "target_type" "ReactionTargetType" NOT NULL,
    "target_id" UUID NOT NULL,
    "reaction_type" "ReactionType" NOT NULL DEFAULT 'LIKE',
    CONSTRAINT "reactions_pkey" PRIMARY KEY ("user_id","target_type","target_id")
);

CREATE TABLE "connections" (
    "id" UUID NOT NULL,
    "requester_id" UUID NOT NULL,
    "addressee_id" UUID NOT NULL,
    "status" "ConnectionStatus" NOT NULL DEFAULT 'PENDING',
    CONSTRAINT "connections_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "conversations" (
    "id" UUID NOT NULL,
    "type" "ConversationType" NOT NULL DEFAULT 'DIRECT',
    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "conversation_participants" (
    "conversation_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "last_read_at" TIMESTAMP(3),
    CONSTRAINT "conversation_participants_pkey" PRIMARY KEY ("conversation_id","user_id")
);

CREATE TABLE "messages" (
    "id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- Create unique constraints
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "skills_name_key" ON "skills"("name");
CREATE UNIQUE INDEX "companies_slug_key" ON "companies"("slug");
CREATE UNIQUE INDEX "applications_job_candidate_unique" ON "applications"("job_id", "candidate_id");
CREATE UNIQUE INDEX "ai_screening_results_application_id_key" ON "ai_screening_results"("application_id");
CREATE UNIQUE INDEX "connections_requester_addressee_unique" ON "connections"("requester_id", "addressee_id");

-- Create indexes
CREATE INDEX "users_role_idx" ON "users"("role");
CREATE INDEX "users_is_verified_idx" ON "users"("is_verified");
CREATE INDEX "users_created_at_idx" ON "users"("created_at");
CREATE INDEX "users_deleted_at_idx" ON "users"("deleted_at");
CREATE INDEX "user_profiles_location_idx" ON "user_profiles"("location");
CREATE INDEX "user_profiles_completeness_idx" ON "user_profiles"("profile_completeness");
CREATE INDEX "work_experiences_user_id_idx" ON "work_experiences"("user_id");
CREATE INDEX "work_experiences_company_idx" ON "work_experiences"("company");
CREATE INDEX "work_experiences_start_date_idx" ON "work_experiences"("start_date");
CREATE INDEX "educations_user_id_idx" ON "educations"("user_id");
CREATE INDEX "educations_school_idx" ON "educations"("school");
CREATE INDEX "educations_start_year_idx" ON "educations"("start_year");
CREATE INDEX "skills_category_idx" ON "skills"("category");
CREATE INDEX "user_skills_skill_id_idx" ON "user_skills"("skill_id");
CREATE INDEX "user_skills_level_idx" ON "user_skills"("level");
CREATE INDEX "skill_endorsements_user_skill_idx" ON "skill_endorsements"("user_id", "skill_id");
CREATE INDEX "skill_endorsements_endorser_idx" ON "skill_endorsements"("endorser_id");
CREATE INDEX "cv_files_user_id_idx" ON "cv_files"("user_id");
CREATE INDEX "cv_files_user_primary_idx" ON "cv_files"("user_id", "is_primary");
CREATE INDEX "companies_industry_idx" ON "companies"("industry");
CREATE INDEX "company_members_user_id_idx" ON "company_members"("user_id");
CREATE INDEX "company_members_company_role_idx" ON "company_members"("company_id", "role");
CREATE INDEX "jobs_company_id_idx" ON "jobs"("company_id");
CREATE INDEX "jobs_created_by_idx" ON "jobs"("created_by");
CREATE INDEX "jobs_status_idx" ON "jobs"("status");
CREATE INDEX "jobs_expires_at_idx" ON "jobs"("expires_at");
CREATE INDEX "jobs_location_idx" ON "jobs"("location");
CREATE INDEX "applications_candidate_id_idx" ON "applications"("candidate_id");
CREATE INDEX "applications_job_id_idx" ON "applications"("job_id");
CREATE INDEX "applications_status_idx" ON "applications"("status");
CREATE INDEX "applications_applied_at_idx" ON "applications"("applied_at");
CREATE INDEX "ai_screening_results_overall_score_idx" ON "ai_screening_results"("overall_score");
CREATE INDEX "ai_screening_results_grade_idx" ON "ai_screening_results"("grade");
CREATE INDEX "application_status_history_changed_by_idx" ON "application_status_history"("changed_by");
CREATE INDEX "application_status_history_application_changed_at_idx" ON "application_status_history"("application_id", "changed_at");
CREATE INDEX "posts_author_created_at_idx" ON "posts"("author_id", "created_at");
CREATE INDEX "posts_company_created_at_idx" ON "posts"("company_id", "created_at");
CREATE INDEX "posts_visibility_idx" ON "posts"("visibility");
CREATE INDEX "posts_deleted_at_idx" ON "posts"("deleted_at");
CREATE INDEX "comments_post_created_at_idx" ON "comments"("post_id", "created_at");
CREATE INDEX "comments_parent_id_idx" ON "comments"("parent_id");
CREATE INDEX "comments_author_id_idx" ON "comments"("author_id");
CREATE INDEX "reactions_target_idx" ON "reactions"("target_type", "target_id");
CREATE INDEX "reactions_reaction_type_idx" ON "reactions"("reaction_type");
CREATE INDEX "connections_requester_status_idx" ON "connections"("requester_id", "status");
CREATE INDEX "connections_addressee_status_idx" ON "connections"("addressee_id", "status");
CREATE INDEX "conversations_type_idx" ON "conversations"("type");
CREATE INDEX "conversation_participants_user_last_read_idx" ON "conversation_participants"("user_id", "last_read_at");
CREATE INDEX "messages_conversation_sent_at_idx" ON "messages"("conversation_id", "sent_at");
CREATE INDEX "messages_sender_sent_at_idx" ON "messages"("sender_id", "sent_at");
CREATE INDEX "messages_is_read_idx" ON "messages"("is_read");
CREATE INDEX "notifications_user_read_created_idx" ON "notifications"("user_id", "is_read", "created_at");
CREATE INDEX "notifications_type_idx" ON "notifications"("type");

-- Add foreign keys
ALTER TABLE "user_profiles"
ADD CONSTRAINT "user_profiles_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "work_experiences"
ADD CONSTRAINT "work_experiences_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "educations"
ADD CONSTRAINT "educations_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_skills"
ADD CONSTRAINT "user_skills_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_skills"
ADD CONSTRAINT "user_skills_skill_id_fkey"
FOREIGN KEY ("skill_id") REFERENCES "skills"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "skill_endorsements"
ADD CONSTRAINT "skill_endorsements_endorser_id_fkey"
FOREIGN KEY ("endorser_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "skill_endorsements"
ADD CONSTRAINT "skill_endorsements_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "skill_endorsements"
ADD CONSTRAINT "skill_endorsements_skill_id_fkey"
FOREIGN KEY ("skill_id") REFERENCES "skills"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "cv_files"
ADD CONSTRAINT "cv_files_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "company_members"
ADD CONSTRAINT "company_members_company_id_fkey"
FOREIGN KEY ("company_id") REFERENCES "companies"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "company_members"
ADD CONSTRAINT "company_members_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "jobs"
ADD CONSTRAINT "jobs_company_id_fkey"
FOREIGN KEY ("company_id") REFERENCES "companies"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "jobs"
ADD CONSTRAINT "jobs_created_by_fkey"
FOREIGN KEY ("created_by") REFERENCES "users"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "applications"
ADD CONSTRAINT "applications_job_id_fkey"
FOREIGN KEY ("job_id") REFERENCES "jobs"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "applications"
ADD CONSTRAINT "applications_candidate_id_fkey"
FOREIGN KEY ("candidate_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "applications"
ADD CONSTRAINT "applications_cv_file_id_fkey"
FOREIGN KEY ("cv_file_id") REFERENCES "cv_files"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ai_screening_results"
ADD CONSTRAINT "ai_screening_results_application_id_fkey"
FOREIGN KEY ("application_id") REFERENCES "applications"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "application_status_history"
ADD CONSTRAINT "application_status_history_application_id_fkey"
FOREIGN KEY ("application_id") REFERENCES "applications"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "application_status_history"
ADD CONSTRAINT "application_status_history_changed_by_fkey"
FOREIGN KEY ("changed_by") REFERENCES "users"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "posts"
ADD CONSTRAINT "posts_author_id_fkey"
FOREIGN KEY ("author_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "posts"
ADD CONSTRAINT "posts_company_id_fkey"
FOREIGN KEY ("company_id") REFERENCES "companies"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "comments"
ADD CONSTRAINT "comments_post_id_fkey"
FOREIGN KEY ("post_id") REFERENCES "posts"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "comments"
ADD CONSTRAINT "comments_parent_id_fkey"
FOREIGN KEY ("parent_id") REFERENCES "comments"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "comments"
ADD CONSTRAINT "comments_author_id_fkey"
FOREIGN KEY ("author_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "reactions"
ADD CONSTRAINT "reactions_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "connections"
ADD CONSTRAINT "connections_requester_id_fkey"
FOREIGN KEY ("requester_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "connections"
ADD CONSTRAINT "connections_addressee_id_fkey"
FOREIGN KEY ("addressee_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "conversation_participants"
ADD CONSTRAINT "conversation_participants_conversation_id_fkey"
FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "conversation_participants"
ADD CONSTRAINT "conversation_participants_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "messages"
ADD CONSTRAINT "messages_conversation_id_fkey"
FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "messages"
ADD CONSTRAINT "messages_sender_id_fkey"
FOREIGN KEY ("sender_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "notifications"
ADD CONSTRAINT "notifications_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
