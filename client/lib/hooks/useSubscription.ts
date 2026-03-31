"use client";

import { analytics } from "@/lib/analytics";
import { subscriptionsApi } from "@/lib/api/subscriptions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useSubscriptionStatus() {
  return useQuery({
    queryKey: ["subscription", "status"],
    queryFn: () => subscriptionsApi.getStatus(),
    select: (data) => data.data,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateCheckout() {
  return useMutation({
    mutationFn: (variantId: string) => subscriptionsApi.createCheckout(variantId),
    onSuccess: (data, variantId) => {
      analytics.checkoutStarted(variantId);
      window.location.href = data.url;
    },
  });
}

export function useOpenBillingPortal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => subscriptionsApi.openPortal(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
      analytics.billingPortalOpened();
      window.location.href = data.url;
    },
  });
}
