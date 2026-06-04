-- DropIndex
DROP INDEX "jobs_description_trgm_idx";

-- DropIndex
DROP INDEX "jobs_title_trgm_idx";

-- AlterTable
ALTER TABLE "cv_files" ADD COLUMN     "extracted_text" TEXT;
