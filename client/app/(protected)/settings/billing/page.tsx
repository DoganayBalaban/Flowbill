"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCreateCheckout,
  useOpenBillingPortal,
  useSubscriptionStatus,
} from "@/lib/hooks/useSubscription";
import { Check, CreditCard, Loader2, Settings, Zap } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { toast } from "sonner";

// ── Plan config ─────────────────────────────────────────────────────────────

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: "$9",
    description: "Perfect for solo freelancers just getting started.",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER ?? "",
    features: [
      "Up to 10 active clients",
      "Unlimited invoices",
      "Time tracking",
      "PDF generation",
      "Client portal",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$19",
    description: "For established freelancers who need more power.",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO ?? "",
    features: [
      "Unlimited clients",
      "Unlimited invoices",
      "Time tracking",
      "PDF generation",
      "Client portal",
      "Expense tracking",
      "Advanced reports",
      "Priority support",
    ],
  },
  {
    id: "agency",
    name: "Agency",
    price: "$49",
    description: "Built for teams and agencies managing multiple freelancers.",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_AGENCY ?? "",
    features: [
      "Everything in Pro",
      "Team members",
      "Role-based access",
      "Client branding",
      "API access",
      "Dedicated support",
    ],
  },
];

// ── Status helpers ───────────────────────────────────────────────────────────

function getStatusBadge(status: string | null) {
  if (!status) return null;
  const map: Record<string, { label: string; className: string }> = {
    active: { label: "Active", className: "bg-green-100 text-green-700" },
    trialing: { label: "Trial", className: "bg-blue-100 text-blue-700" },
    past_due: { label: "Past Due", className: "bg-red-100 text-red-700" },
    canceled: { label: "Canceled", className: "bg-gray-100 text-gray-700" },
  };
  const info = map[status];
  if (!info) return null;
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${info.className}`}>
      {info.label}
    </span>
  );
}

// ── Stripe return handler (needs Suspense for useSearchParams) ───────────────

function StripeReturnHandler({ refetch }: { refetch: () => void }) {
  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams.get("session_id")) {
      refetch();
      toast.success("Plan upgraded successfully!");
    }
  }, [searchParams, refetch]);
  return null;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function BillingPage() {
  const { data: subscription, isLoading, refetch } = useSubscriptionStatus();
  const createCheckout = useCreateCheckout();
  const openPortal = useOpenBillingPortal();

  const currentPlan = subscription?.plan ?? "free";
  const isOnPaidPlan = currentPlan !== "free";

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <Suspense fallback={null}>
        <StripeReturnHandler refetch={refetch} />
      </Suspense>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing & Plans</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your subscription and payment details.
        </p>
      </div>

      {/* Current plan card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Current Plan
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold capitalize">{currentPlan}</span>
            {getStatusBadge(subscription?.stripe_subscription_status ?? null)}
          </div>
          {subscription?.plan_expires_at && (
            <p className="text-xs text-muted-foreground">
              Renews{" "}
              {new Date(subscription.plan_expires_at).toLocaleDateString("en-US", {
                dateStyle: "medium",
              })}
            </p>
          )}
        </CardContent>
        {isOnPaidPlan && (
          <CardFooter className="border-t pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => openPortal.mutate()}
              disabled={openPortal.isPending}
            >
              {openPortal.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Settings className="mr-2 h-4 w-4" />
              )}
              Manage Billing
            </Button>
          </CardFooter>
        )}
      </Card>

      <Separator />

      {/* Pricing cards */}
      <div>
        <h2 className="text-lg font-semibold mb-4">
          {isOnPaidPlan ? "Change Plan" : "Upgrade Your Plan"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const isCurrent = currentPlan === plan.id;
            const isPopular = plan.id === "pro";

            return (
              <Card
                key={plan.id}
                className={`relative flex flex-col ${isCurrent ? "border-primary ring-1 ring-primary" : ""}`}
              >
                {isPopular && !isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-violet-600 text-white text-xs px-3">
                      Most Popular
                    </Badge>
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground text-xs px-3">
                      Current Plan
                    </Badge>
                  </div>
                )}

                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-500" />
                    {plan.name}
                  </CardTitle>
                  <div className="mt-1">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground text-sm">/month</span>
                  </div>
                  <CardDescription className="text-xs mt-1">
                    {plan.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-1">
                  <ul className="space-y-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button
                    className="w-full"
                    variant={isCurrent ? "outline" : isPopular ? "default" : "outline"}
                    disabled={isCurrent || createCheckout.isPending}
                    onClick={() =>
                      !isCurrent && createCheckout.mutate(plan.priceId)
                    }
                  >
                    {createCheckout.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    {isCurrent ? "Current Plan" : `Upgrade to ${plan.name}`}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
