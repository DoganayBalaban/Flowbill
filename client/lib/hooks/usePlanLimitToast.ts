"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

export function usePlanLimitToast() {
  const router = useRouter();

  useEffect(() => {
    function handler(e: Event) {
      const message = (e as CustomEvent<{ message: string }>).detail.message;
      toast.error(message, {
        duration: 6000,
        action: {
          label: "Upgrade Plan",
          onClick: () => router.push("/settings/billing"),
        },
      });
    }

    window.addEventListener("plan-limit-error", handler);
    return () => window.removeEventListener("plan-limit-error", handler);
  }, [router]);
}
