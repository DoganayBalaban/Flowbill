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
    mutationFn: (priceId: string) => subscriptionsApi.createCheckout(priceId),
    onSuccess: (data, priceId) => {
      analytics.checkoutStarted(priceId);
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
