import api from "./client";

export interface PlanLimits {
  clients: number;
  activeProjects: number;
  invoicesPerMonth: number;
  invoicesTotalCap: number;
  expenseTracking: boolean;
  clientPortal: boolean;
}

export interface SubscriptionStatus {
  plan: string;
  plan_expires_at: string | null;
  lemon_subscription_status: string | null;
  lemon_subscription_id: string | null;
  limits: PlanLimits;
}

export const subscriptionsApi = {
  getStatus: async (): Promise<{ success: boolean; data: SubscriptionStatus }> => {
    const response = await api.get("/subscriptions/status");
    return response.data;
  },

  createCheckout: async (
    variantId: string,
  ): Promise<{ success: boolean; url: string }> => {
    const response = await api.post("/subscriptions/checkout", { variantId });
    return response.data;
  },

  openPortal: async (): Promise<{ success: boolean; url: string }> => {
    const response = await api.post("/subscriptions/portal");
    return response.data;
  },
};

export default subscriptionsApi;
