import { sendGAEvent } from "@next/third-parties/google";

export function trackEvent(
  event: string,
  params?: Record<string, string | number>,
) {
  if (typeof window === "undefined") return;
  if (!process.env.NEXT_PUBLIC_GA_ID) return;
  sendGAEvent("event", event, params ?? {});
}

// Predefined events for type safety
export const analytics = {
  // Auth
  signupCompleted: () => trackEvent("signup_completed"),
  loginSuccess: () => trackEvent("login_success"),

  // Invoices
  invoiceCreated: (currency: string) =>
    trackEvent("invoice_created", { currency }),
  invoicePdfDownloaded: () => trackEvent("invoice_pdf_downloaded"),
  invoiceEmailSent: () => trackEvent("invoice_email_sent"),
  invoiceMarkedPaid: () => trackEvent("invoice_marked_paid"),
  paymentLinkCreated: () => trackEvent("payment_link_created"),

  // Expenses
  expenseCreated: () => trackEvent("expense_created"),

  // Projects & Clients
  projectCreated: () => trackEvent("project_created"),
  clientCreated: () => trackEvent("client_created"),

  // Time tracking
  timerStarted: () => trackEvent("timer_started"),
  timerStopped: () => trackEvent("timer_stopped"),
  manualTimeEntryCreated: () => trackEvent("manual_time_entry_created"),

  // Onboarding
  onboardingCompleted: (role: string) =>
    trackEvent("onboarding_completed", { role }),

  // Subscription
  checkoutStarted: (priceId: string) =>
    trackEvent("checkout_started", { price_id: priceId }),
  billingPortalOpened: () => trackEvent("billing_portal_opened"),
};
