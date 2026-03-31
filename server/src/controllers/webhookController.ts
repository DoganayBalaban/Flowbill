import { Request, Response } from "express";
import { verifyLSWebhookSignature } from "../config/lemonSqueezy";
import { InvoiceService } from "../services/invoiceService";
import { SubscriptionService } from "../services/subscriptionService";
import { catchAsync } from "../utils/catchAsync";
import logger from "../utils/logger";

export const handleLemonSqueezyWebhook = catchAsync(
  async (req: Request, res: Response) => {
    const signature = req.headers["x-signature"] as string;

    if (!signature || !verifyLSWebhookSignature(req.body as Buffer, signature)) {
      logger.error("[webhook] LemonSqueezy signature verification failed");
      return res.status(400).json({ error: "Invalid webhook signature" });
    }

    const payload = JSON.parse((req.body as Buffer).toString());
    const eventName = req.headers["x-event-name"] as string;

    logger.info(`[webhook] LemonSqueezy event received: ${eventName}`);

    switch (eventName) {
      case "subscription_created":
      case "subscription_updated":
        await SubscriptionService.handleSubscriptionCreatedOrUpdated(payload);
        break;

      case "subscription_cancelled":
        await SubscriptionService.handleSubscriptionCancelled(payload);
        break;

      case "subscription_payment_failed":
        await SubscriptionService.handlePaymentFailed(payload);
        break;

      case "order_created": {
        const invoiceId = payload.meta?.custom_data?.invoiceId as string | undefined;
        if (invoiceId) {
          await InvoiceService.handleLemonSqueezyOrderPaid(payload);
          logger.info(`[webhook] Invoice ${invoiceId} marked as paid via LemonSqueezy`);
        }
        break;
      }

      default:
        logger.info(`[webhook] Unhandled event: ${eventName}`);
    }

    return res.json({ received: true });
  },
);
