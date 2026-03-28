import { sendGAEvent } from "@next/third-parties/google";

export function trackEvent(
  event: string,
  params?: Record<string, string | number>,
) {
  if (typeof window === "undefined") return;
  if (!process.env.NEXT_PUBLIC_GA_ID) return;
  sendGAEvent("event", event, params);
}

// Predefined events for type safety
export const analytics = {
  signupCompleted: () => trackEvent("signup_completed"),
  loginSuccess: () => trackEvent("login_success"),
  invoiceCreated: (currency: string) =>
    trackEvent("invoice_created", { currency }),
  invoicePdfDownloaded: () => trackEvent("invoice_pdf_downloaded"),
  invoiceEmailSent: () => trackEvent("invoice_email_sent"),
  expenseCreated: () => trackEvent("expense_created"),
  projectCreated: () => trackEvent("project_created"),
  clientCreated: () => trackEvent("client_created"),
  timerStarted: () => trackEvent("timer_started"),
  timerStopped: () => trackEvent("timer_stopped"),
};
