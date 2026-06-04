-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'WITHDRAWN');

-- CreateTable
CREATE TABLE "offers" (
    "id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "salary_amount" INTEGER,
    "salary_currency" TEXT NOT NULL DEFAULT 'VND',
    "start_date" TIMESTAMP(3),
    "response_deadline" TIMESTAMP(3),
    "note" TEXT,
    "offer_letter_url" TEXT,
    "status" "OfferStatus" NOT NULL DEFAULT 'PENDING',
    "decline_reason" TEXT,
    "created_by" UUID NOT NULL,
    "responded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "offers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "offers_application_id_key" ON "offers"("application_id");

-- CreateIndex
CREATE INDEX "offers_status_idx" ON "offers"("status");

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
