-- AlterTable: Add portal fields to clients
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "portal_token" TEXT;
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "portal_enabled" BOOLEAN NOT NULL DEFAULT false;

-- Populate portal_token for existing rows (use gen_random_uuid() if available, otherwise uuid_generate_v4())
UPDATE "clients" SET "portal_token" = gen_random_uuid()::text WHERE "portal_token" IS NULL;

-- CreateIndex: unique constraint on portal_token
CREATE UNIQUE INDEX IF NOT EXISTS "clients_portal_token_key" ON "clients"("portal_token");

-- CreateTable: portal_sessions
CREATE TABLE IF NOT EXISTS "portal_sessions" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "token" VARCHAR(500) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portal_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "portal_sessions_token_key" ON "portal_sessions"("token");
CREATE INDEX IF NOT EXISTS "portal_sessions_token_idx" ON "portal_sessions"("token");
CREATE INDEX IF NOT EXISTS "portal_sessions_client_id_idx" ON "portal_sessions"("client_id");

-- AddForeignKey
ALTER TABLE "portal_sessions" ADD CONSTRAINT "portal_sessions_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
