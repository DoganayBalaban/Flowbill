import express, { Router } from "express";
import { handleLemonSqueezyWebhook } from "../controllers/webhookController";

const router = Router();

/**
 * IMPORTANT: This route uses express.raw() to preserve the raw request body
 * required for LemonSqueezy webhook signature verification.
 * It MUST be mounted in index.ts BEFORE express.json().
 */
router.post(
  "/lemonsqueezy",
  express.raw({ type: "application/json" }),
  handleLemonSqueezyWebhook,
);

export default router;
