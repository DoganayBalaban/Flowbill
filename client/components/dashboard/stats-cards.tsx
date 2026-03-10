"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardStats } from "@/lib/api/dashboard";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Clock,
  DollarSign,
  FolderOpen,
} from "lucide-react";

interface StatsCardsProps {
  data: DashboardStats | undefined;
  isLoading: boolean;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatHours(value: number): string {
  return `${value.toFixed(1)}h`;
}

export function StatsCards({ data, isLoading }: StatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="relative overflow-hidden">
            <CardContent className="p-6">
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) return null;

  const cards = [
    {
      title: "Monthly Revenue",
      value: formatCurrency(data.monthlyRevenue),
      icon: DollarSign,
      growth: data.growthPercentage,
      description: "vs. previous month",
      gradient: "from-emerald-500/10 to-emerald-500/5",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      borderColor: "border-emerald-500/20",
    },
    {
      title: "Hours Tracked",
      value: formatHours(data.totalHours),
      icon: Clock,
      subtitle: `${formatHours(data.billableHours)} billable`,
      gradient: "from-blue-500/10 to-blue-500/5",
      iconColor: "text-blue-600 dark:text-blue-400",
      borderColor: "border-blue-500/20",
    },
    {
      title: "Active Projects",
      value: data.activeProjects.toString(),
      icon: FolderOpen,
      description: "In progress",
      gradient: "from-violet-500/10 to-violet-500/5",
      iconColor: "text-violet-600 dark:text-violet-400",
      borderColor: "border-violet-500/20",
    },
    {
      title: "Outstanding",
      value: formatCurrency(data.pendingAmount),
      icon: AlertTriangle,
      badge:
        data.overdueInvoices > 0
          ? `${data.overdueInvoices} overdue`
          : undefined,
      gradient: "from-amber-500/10 to-amber-500/5",
      iconColor: "text-amber-600 dark:text-amber-400",
      borderColor: "border-amber-500/20",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card
          key={card.title}
          className={`relative overflow-hidden border ${card.borderColor} transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5`}
        >
          {/* Gradient background */}
          <div
            className={`absolute inset-0 bg-gradient-to-br ${card.gradient} pointer-events-none`}
          />
          <CardContent className="relative p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-muted-foreground">
                {card.title}
              </p>
              <div
                className={`p-2 rounded-lg bg-background/80 backdrop-blur-sm ${card.iconColor}`}
              >
                <card.icon className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-bold tracking-tight">{card.value}</p>
            <div className="flex items-center gap-2 mt-2">
              {card.growth !== undefined && (
                <span
                  className={`inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-md ${
                    card.growth >= 0
                      ? "text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/40"
                      : "text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/40"
                  }`}
                >
                  {card.growth >= 0 ? (
                    <ArrowUp className="h-3 w-3" />
                  ) : (
                    <ArrowDown className="h-3 w-3" />
                  )}
                  %{Math.abs(card.growth).toFixed(1)}
                </span>
              )}
              {card.description && (
                <span className="text-xs text-muted-foreground">
                  {card.description}
                </span>
              )}
              {card.subtitle && (
                <span className="text-xs text-muted-foreground">
                  {card.subtitle}
                </span>
              )}
              {card.badge && (
                <span className="text-xs font-medium text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/40 px-1.5 py-0.5 rounded-md">
                  {card.badge}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
