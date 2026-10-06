ALTER TABLE "users" ADD COLUMN "username" TEXT, ADD COLUMN "phone" TEXT;
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
CREATE TABLE "user_follows" (
  "follower_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "followed_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("follower_id", "followed_id")
);
CREATE TABLE "password_recovery_requests" (
  "id" UUID NOT NULL PRIMARY KEY,
  "email" TEXT, "phone" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TYPE "ReactionType" ADD VALUE 'LOVE';
ALTER TYPE "ReactionType" ADD VALUE 'HAHA';
ALTER TYPE "ReactionType" ADD VALUE 'WOW';
ALTER TYPE "ReactionType" ADD VALUE 'SAD';
ALTER TYPE "ReactionType" ADD VALUE 'ANGRY';
