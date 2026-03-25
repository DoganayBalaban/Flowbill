"use client";

import { OverdueAlerts } from "@/components/dashboard/overdue-alerts";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { TopClients } from "@/components/dashboard/top-clients";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useResendVerification, useUser } from "@/lib/hooks/useAuth";
import {
  useDashboardStats,
  useOverdueInvoices,
  useRecentActivity,
  useRevenueChart,
} from "@/lib/hooks/useDashboard";
import { useTranslation } from "@/lib/i18n/context";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Loader2, Mail, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: user, isLoading: userLoading, error } = useUser();
  const resendVerification = useResendVerification();
  const { t, locale } = useTranslation();

  // Dashboard data hooks (AP: 5 min staleTime)
  const stats = useDashboardStats();
  const revenue = useRevenueChart();
  const activity = useRecentActivity(10);
  const overdue = useOverdueInvoices();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!userLoading && error) {
      router.push("/login");
    }
  }, [userLoading, error, router]);

  // Redirect to onboarding if not completed
  useEffect(() => {
    if (!userLoading && user && !user.is_onboarding_completed) {
      router.push("/onboarding");
    }
  }, [userLoading, user, router]);

  if (userLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleResendVerification = () => {
    if (user.email) {
      resendVerification.mutate(user.email);
    }
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  // Last data update timestamp
  const lastUpdated = stats.dataUpdatedAt
    ? new Date(stats.dataUpdatedAt).toLocaleTimeString(locale === "tr" ? "tr-TR" : "en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Email verification warning */}
      {!user.email_verified && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
                  {t("dashboard.email_not_verified")}
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  {t("dashboard.verify_email_desc")}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={handleResendVerification}
                  disabled={resendVerification.isPending}
                >
                  {resendVerification.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="mr-2 h-4 w-4" />
                  )}
                  {t("dashboard.resend_verification")}
                </Button>
                {resendVerification.isSuccess && (
                  <p className="text-sm text-green-600 mt-2">
                    {t("dashboard.verification_sent")}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {t("dashboard.welcome", { name: user.first_name ?? "" })}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("dashboard.overview")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-xs text-muted-foreground">
              {t("dashboard.updated_at", { time: lastUpdated })}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="gap-1.5"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${stats.isFetching ? "animate-spin" : ""}`}
            />
            {t("dashboard.refresh")}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards data={stats.data} isLoading={stats.isLoading} />

      {/* Revenue Chart (full width) */}
      <RevenueChart data={revenue.data} isLoading={revenue.isLoading} />

      {/* Bottom Grid: Left (Overdue + Activity) | Right (Top Clients) */}
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-6">
          <OverdueAlerts data={overdue.data} isLoading={overdue.isLoading} />
          <RecentActivity data={activity.data} isLoading={activity.isLoading} />
        </div>
        <div className="lg:col-span-2">
          <TopClients />
        </div>
      </div>
    </div>
  );
}
