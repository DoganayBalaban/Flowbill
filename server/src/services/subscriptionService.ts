import { env } from "../config/env";
import { createLSCheckout, getLSCustomerPortalUrl } from "../config/lemonSqueezy";
import { getPlanLimits } from "../config/planLimits";
import { emailQueue } from "../queues/emailQueue";
import { AppError } from "../utils/appError";
import logger from "../utils/logger";
import { prisma } from "../utils/prisma";
import { redis } from "../config/redis";

// Maps plan name → LemonSqueezy variant ID
const PLAN_VARIANT_MAP: Record<string, string> = {
  starter: env.LEMONSQUEEZY_VARIANT_STARTER,
  pro: env.LEMONSQUEEZY_VARIANT_PRO,
  agency: env.LEMONSQUEEZY_VARIANT_AGENCY,
};

// Maps LemonSqueezy variant ID → plan name
const VARIANT_PLAN_MAP: Record<string, string> = {
  [env.LEMONSQUEEZY_VARIANT_STARTER]: "starter",
  [env.LEMONSQUEEZY_VARIANT_PRO]: "pro",
  [env.LEMONSQUEEZY_VARIANT_AGENCY]: "agency",
};

export class SubscriptionService {
  /**
   * Creates a LemonSqueezy checkout URL for subscribing to a plan.
   * Returns the hosted checkout URL.
   */
  static async createCheckoutSession(
    userId: string,
    variantId: string,
  ): Promise<string> {
    const knownVariants = Object.values(PLAN_VARIANT_MAP).filter(Boolean);
    if (!knownVariants.includes(variantId)) {
      throw new AppError("Invalid plan variant", 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    if (!user) throw new AppError("User not found", 404);

    const url = await createLSCheckout({
      variantId,
      email: user.email,
      userId,
      redirectUrl: `${env.FRONTEND_URL}/settings/billing?upgraded=true`,
    });

    return url;
  }

  /**
   * Returns the LemonSqueezy customer portal URL so users can manage
   * their subscription, update payment methods, cancel, etc.
   */
  static async createBillingPortalSession(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { lemon_subscription_id: true },
    });

    if (!user?.lemon_subscription_id) {
      throw new AppError("No active subscription found", 400);
    }

    const url = await getLSCustomerPortalUrl(user.lemon_subscription_id);
    return url;
  }

  /**
   * Returns current subscription status for the user, including plan limits.
   */
  static async getStatus(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        plan: true,
        plan_expires_at: true,
        lemon_subscription_status: true,
        lemon_subscription_id: true,
      },
    });

    if (!user) throw new AppError("User not found", 404);

    return {
      ...user,
      limits: getPlanLimits(user.plan),
    };
  }

  /**
   * Maps a LemonSqueezy variant ID to a Flowbill plan name.
   */
  static getPlanFromVariantId(variantId: string): string {
    return VARIANT_PLAN_MAP[String(variantId)] ?? "free";
  }

  /**
   * Handles subscription_created and subscription_updated webhook events.
   */
  static async handleSubscriptionCreatedOrUpdated(payload: any): Promise<void> {
    const userId = payload.meta?.custom_data?.userId as string | undefined;
    if (!userId) {
      logger.warn("[subscription] No userId in webhook custom_data");
      return;
    }

    const attrs = payload.data?.attributes ?? {};
    const variantId = String(attrs.variant_id ?? "");
    const plan = SubscriptionService.getPlanFromVariantId(variantId);
    const status: string = attrs.status ?? "active";
    const renewsAt: string | null = attrs.renews_at ?? null;
    const subscriptionId = String(payload.data?.id ?? "");

    await prisma.user.update({
      where: { id: userId },
      data: {
        plan,
        plan_expires_at: renewsAt ? new Date(renewsAt) : null,
        lemon_subscription_id: subscriptionId,
        lemon_subscription_status: status,
      },
    });

    await redis.del(`dashboard:stats:${userId}`);
    logger.info(`[subscription] User ${userId} plan updated to ${plan} (${status})`);
  }

  /**
   * Handles subscription_cancelled webhook event — resets user to free plan.
   */
  static async handleSubscriptionCancelled(payload: any): Promise<void> {
    const userId = payload.meta?.custom_data?.userId as string | undefined;
    if (!userId) return;

    await prisma.user.update({
      where: { id: userId },
      data: {
        plan: "free",
        plan_expires_at: null,
        lemon_subscription_id: null,
        lemon_subscription_status: "cancelled",
      },
    });

    await redis.del(`dashboard:stats:${userId}`);
    logger.info(`[subscription] User ${userId} downgraded to free (subscription cancelled)`);
  }

  /**
   * Handles subscription_payment_failed event — marks as past_due and emails user.
   */
  static async handlePaymentFailed(payload: any): Promise<void> {
    const subscriptionId = String(payload.data?.id ?? "");
    if (!subscriptionId) return;

    const user = await prisma.user.findFirst({
      where: { lemon_subscription_id: subscriptionId },
      select: { id: true },
    });
    if (!user) return;

    await prisma.user.update({
      where: { id: user.id },
      data: { lemon_subscription_status: "past_due" },
    });

    await emailQueue.add("subscription-payment-failed", { userId: user.id });
    logger.warn(`[subscription] Payment failed for user ${user.id}`);
  }
}
