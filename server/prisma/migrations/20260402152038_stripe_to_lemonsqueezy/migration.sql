-- DropIndex (safe)
DROP INDEX IF EXISTS "users_stripe_customer_id_key";
DROP INDEX IF EXISTS "users_stripe_subscription_id_key";

-- AlterTable invoices
ALTER TABLE "invoices"
  DROP COLUMN IF EXISTS "stripe_payment_intent_id",
  DROP COLUMN IF EXISTS "stripe_payment_link_id",
  DROP COLUMN IF EXISTS "stripe_payment_link_url";

ALTER TABLE "invoices"
  ADD COLUMN IF NOT EXISTS "lemon_checkout_id" VARCHAR(200),
  ADD COLUMN IF NOT EXISTS "lemon_checkout_url" TEXT,
  ADD COLUMN IF NOT EXISTS "lemon_order_id" VARCHAR(100);

-- AlterTable payments
ALTER TABLE "payments"
  DROP COLUMN IF EXISTS "stripe_payment_intent_id";

ALTER TABLE "payments"
  ADD COLUMN IF NOT EXISTS "lemon_order_id" VARCHAR(100);

-- AlterTable users
ALTER TABLE "users"
  DROP COLUMN IF EXISTS "stripe_customer_id",
  DROP COLUMN IF EXISTS "stripe_subscription_id",
  DROP COLUMN IF EXISTS "stripe_subscription_status";

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "lemon_customer_id" VARCHAR(100),
  ADD COLUMN IF NOT EXISTS "lemon_subscription_id" VARCHAR(100),
  ADD COLUMN IF NOT EXISTS "lemon_subscription_status" VARCHAR(30);

-- CreateIndex (safe)
CREATE UNIQUE INDEX IF NOT EXISTS "users_lemon_customer_id_key" ON "users"("lemon_customer_id");
CREATE UNIQUE INDEX IF NOT EXISTS "users_lemon_subscription_id_key" ON "users"("lemon_subscription_id");
