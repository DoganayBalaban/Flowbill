import crypto from "crypto";
import { env } from "./env";

// LemonSqueezy API base URL
const LS_API_BASE = "https://api.lemonsqueezy.com/v1";

/**
 * Makes an authenticated request to the LemonSqueezy API.
 */
export async function lsRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${LS_API_BASE}${path}`, {
    ...options,
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${env.LEMONSQUEEZY_API_KEY}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`LemonSqueezy API error ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

/**
 * Creates a LemonSqueezy checkout URL for a subscription variant.
 * Embeds userId in custom_data so the webhook can identify the user.
 */
export async function createLSCheckout(opts: {
  variantId: string;
  email: string;
  userId: string;
  redirectUrl: string;
}): Promise<string> {
  const body = {
    data: {
      type: "checkouts",
      attributes: {
        checkout_options: { embed: false },
        checkout_data: {
          email: opts.email,
          custom: { userId: opts.userId },
        },
        product_options: {
          redirect_url: opts.redirectUrl,
        },
      },
      relationships: {
        store: {
          data: { type: "stores", id: env.LEMONSQUEEZY_STORE_ID },
        },
        variant: {
          data: { type: "variants", id: opts.variantId },
        },
      },
    },
  };

  const response = await lsRequest<{ data: { attributes: { url: string } } }>(
    "/checkouts",
    { method: "POST", body: JSON.stringify(body) },
  );

  return response.data.attributes.url;
}

/**
 * Fetches a subscription and returns the customer portal URL.
 */
export async function getLSCustomerPortalUrl(
  subscriptionId: string,
): Promise<string> {
  const response = await lsRequest<{
    data: { attributes: { urls: { customer_portal: string } } };
  }>(`/subscriptions/${subscriptionId}`);

  return response.data.attributes.urls.customer_portal;
}

/**
 * Verifies the HMAC-SHA256 signature of a LemonSqueezy webhook.
 * Returns true if valid.
 */
export function verifyLSWebhookSignature(
  rawBody: Buffer,
  signature: string,
): boolean {
  if (!env.LEMONSQUEEZY_WEBHOOK_SECRET) return false;
  const hmac = crypto
    .createHmac("sha256", env.LEMONSQUEEZY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(signature));
}
