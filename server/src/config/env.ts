import dotenv from "dotenv";

dotenv.config();

export const env = {
  PORT: process.env.PORT || 3000,
  DATABASE_URL: process.env.DATABASE_URL || "",
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || "",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "",
  NODE_ENV: process.env.NODE_ENV || "development",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
  REDIS_HOST: process.env.REDIS_HOST || "",
  REDIS_PORT: process.env.REDIS_PORT || "",
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || "",
  REDIS_TLS: process.env.REDIS_TLS === "true",
  RESEND_API_KEY: process.env.RESEND_API_KEY || "",
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || "",
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || "",
  AWS_REGION: process.env.AWS_REGION || "",
  AWS_BUCKET_NAME: process.env.AWS_BUCKET_NAME || "",
  CLOUDFRONT_URL: process.env.CLOUDFRONT_URL || "",
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || "",
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || "",
  STRIPE_INVOICE_WEBHOOK_SECRET: process.env.STRIPE_INVOICE_WEBHOOK_SECRET || "",
  STRIPE_PRICE_STARTER: process.env.STRIPE_PRICE_STARTER || "",
  STRIPE_PRICE_PRO: process.env.STRIPE_PRICE_PRO || "",
  STRIPE_PRICE_AGENCY: process.env.STRIPE_PRICE_AGENCY || "",
  SENTRY_DSN: process.env.SENTRY_DSN || "",
};
