import Stripe from "stripe";
import { env } from "../config/env";
import { stripe } from "../config/stripe";
import { emailQueue } from "../queues/emailQueue";
import { AppError } from "../utils/appError";
import logger from "../utils/logger";
import { prisma } from "../utils/prisma";
import { redis } from "../config/redis";

const PLAN_PRICE_MAP: Record<string, string> = {
  starter: env.STRIPE_PRICE_STARTER,
  pro: env.STRIPE_PRICE_PRO,
  agency: env.STRIPE_PRICE_AGENCY,
};

const PRICE_PLAN_MAP: Record<string, string> = {
  [env.STRIPE_PRICE_STARTER]: "starter",
  [env.STRIPE_PRICE_PRO]: "pro",
  [env.STRIPE_PRICE_AGENCY]: "agency",
};

export class SubscriptionService {
  /**
   * Returns the Stripe Customer ID for the user.
   * Creates a new Stripe customer if one doesn't exist yet.
   */
  static async createOrRetrieveCustomer(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        stripe_customer_id: true,
      },
    });

    if (!user) throw new AppError("User not found", 404);

    if (user.stripe_customer_id) {
      return user.stripe_customer_id;
    }

    const customer = await stripe.customers.create({
      email: user.email,
      name: [user.first_name, user.last_name].filter(Boolean).join(" ") || undefined,
      metadata: { userId },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { stripe_customer_id: customer.id },
    });

    return customer.id;
  }

  /**
   * Creates a Stripe Checkout Session for subscribing to a plan.
   * Returns the hosted checkout URL.
   */
  static async createCheckoutSession(
    userId: string,
    priceId: string,
  ): Promise<string> {
    if (!Object.values(PLAN_PRICE_MAP).includes(priceId)) {
      throw new AppError("Invalid plan", 400);
    }

    const customerId = await SubscriptionService.createOrRetrieveCustomer(userId);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${env.FRONTEND_URL}/settings/billing?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.FRONTEND_URL}/settings/billing`,
      subscription_data: {
        metadata: { userId },
      },
      metadata: { userId },
    });

    return session.url!;
  }

  /**
   * Creates a Stripe Customer Portal session so users can manage
   * their subscription, update payment methods, cancel, etc.
   */
  static async createBillingPortalSession(userId: string): Promise<string> {
    const customerId = await SubscriptionService.createOrRetrieveCustomer(userId);

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${env.FRONTEND_URL}/settings/billing`,
    });

    return session.url;
  }

  /**
   * Returns current subscription status for the user.
   */
  static async getStatus(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        plan: true,
        plan_expires_at: true,
        stripe_subscription_status: true,
        stripe_subscription_id: true,
      },
    });

    if (!user) throw new AppError("User not found", 404);
    return user;
  }

  /**
   * Maps a Stripe price ID to a Flowbill plan name.
   */
  static getPlanFromPriceId(priceId: string): string {
    return PRICE_PLAN_MAP[priceId] ?? "free";
  }

  /**
   * Handles customer.subscription.created / customer.subscription.updated events.
   * Updates the user's plan and subscription status.
   */
  static async handleSubscriptionUpdated(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    const userId =
      (subscription.metadata?.userId as string | undefined) ??
      (await SubscriptionService.getUserIdByCustomer(subscription.customer as string));

    if (!userId) {
      logger.warn(`[subscription] No userId for subscription ${subscription.id}`);
      return;
    }

    const priceId = subscription.items.data[0]?.price?.id;
    const plan = priceId
      ? SubscriptionService.getPlanFromPriceId(priceId)
      : "free";

    // billing_cycle_anchor is the anchor date; cancel_at is set if scheduled to cancel
    const periodEnd = subscription.cancel_at
      ? new Date(subscription.cancel_at * 1000)
      : null;

    await prisma.user.update({
      where: { id: userId },
      data: {
        plan,
        plan_expires_at: periodEnd,
        stripe_subscription_id: subscription.id,
        stripe_subscription_status: subscription.status,
      },
    });

    await redis.del(`dashboard:stats:${userId}`);
    logger.info(`[subscription] User ${userId} plan updated to ${plan} (${subscription.status})`);
  }

  /**
   * Handles customer.subscription.deleted — resets user to free plan.
   */
  static async handleSubscriptionDeleted(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    const userId =
      (subscription.metadata?.userId as string | undefined) ??
      (await SubscriptionService.getUserIdByCustomer(subscription.customer as string));

    if (!userId) return;

    await prisma.user.update({
      where: { id: userId },
      data: {
        plan: "free",
        plan_expires_at: null,
        stripe_subscription_id: null,
        stripe_subscription_status: "canceled",
      },
    });

    await redis.del(`dashboard:stats:${userId}`);
    logger.info(`[subscription] User ${userId} downgraded to free (subscription deleted)`);
  }

  /**
   * Handles invoice.payment_failed — marks subscription as past_due
   * and notifies the user via email.
   */
  static async handlePaymentFailed(
    stripeInvoice: Stripe.Invoice,
  ): Promise<void> {
    const customerId =
      typeof stripeInvoice.customer === "string"
        ? stripeInvoice.customer
        : stripeInvoice.customer?.id;

    if (!customerId) return;

    const userId = await SubscriptionService.getUserIdByCustomer(customerId);
    if (!userId) return;

    await prisma.user.update({
      where: { id: userId },
      data: { stripe_subscription_status: "past_due" },
    });

    await emailQueue.add("subscription-payment-failed", { userId });
    logger.warn(`[subscription] Payment failed for user ${userId}`);
  }

  /**
   * Looks up a userId by Stripe customer ID.
   */
  private static async getUserIdByCustomer(
    customerId: string,
  ): Promise<string | null> {
    const user = await prisma.user.findFirst({
      where: { stripe_customer_id: customerId },
      select: { id: true },
    });
    return user?.id ?? null;
  }
}
