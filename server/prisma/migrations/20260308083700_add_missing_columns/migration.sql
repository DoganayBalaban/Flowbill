-- AlterTable: users - add password reset, onboarding, and email verification columns
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_reset_token" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_reset_expires" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_onboarding_completed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "verification_token" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "verification_token_expires" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "users_password_reset_token_key" ON "users"("password_reset_token");
CREATE UNIQUE INDEX IF NOT EXISTS "users_verification_token_key" ON "users"("verification_token");

-- AlterTable: invoices - add pdf_status, pdf_generated_at, sent_at columns
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "pdf_status" VARCHAR(20) NOT NULL DEFAULT 'not_generated';
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "pdf_generated_at" TIMESTAMP(3);
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "sent_at" TIMESTAMP(3);
