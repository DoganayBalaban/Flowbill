"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { OverdueInvoicesResponse } from "@/lib/api/dashboard";
import { AlertTriangle, Calendar, DollarSign } from "lucide-react";

interface OverdueAlertsProps {
  data: OverdueInvoicesResponse | undefined;
  isLoading: boolean;
}

const riskStyles = {
  critical: {
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-700 dark:text-red-400",
    border: "border-red-200 dark:border-red-800",
    badge: "bg-red-600 hover:bg-red-600",
    label: "Critical",
  },
  high: {
    bg: "bg-orange-100 dark:bg-orange-900/30",
    text: "text-orange-700 dark:text-orange-400",
    border: "border-orange-200 dark:border-orange-800",
    badge: "bg-orange-500 hover:bg-orange-500",
    label: "High",
  },
  medium: {
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
    text: "text-yellow-700 dark:text-yellow-400",
    border: "border-yellow-200 dark:border-yellow-800",
    badge: "bg-yellow-500 hover:bg-yellow-500",
    label: "Medium",
  },
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
  }).format(new Date(dateStr));
}

export function OverdueAlerts({ data, isLoading }: OverdueAlertsProps) {
  return (
    <Card className="border transition-all duration-300 hover:shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Overdue Invoices
            </CardTitle>
            <CardDescription>
              Invoices past their due date awaiting payment
            </CardDescription>
          </div>
          {data && data.totalOverdue > 0 && (
            <div className="text-right">
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {formatCurrency(data.totalAmount)}
              </p>
              <p className="text-xs text-muted-foreground">
                {data.totalOverdue} {data.totalOverdue === 1 ? "invoice" : "invoices"}
              </p>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : !data || data.data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-3">
              <DollarSign className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-sm font-medium">No overdue invoices!</p>
            <p className="text-xs text-muted-foreground mt-1">
              All invoices have been paid on time
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.data.map((invoice) => {
              const styles = riskStyles[invoice.riskLevel];
              return (
                <div
                  key={invoice.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${styles.border} ${styles.bg} transition-colors`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-semibold ${styles.text}`}>
                        {invoice.invoiceNumber}
                      </p>
                      <Badge
                        className={`text-[10px] px-1.5 py-0 text-white ${styles.badge}`}
                      >
                        {styles.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {invoice.clientName}
                    </p>
                  </div>
                  <div className="text-right ml-3 shrink-0">
                    <p className={`text-sm font-bold ${styles.text}`}>
                      {formatCurrency(invoice.amount)}
                    </p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1 justify-end">
                      <Calendar className="h-3 w-3" />
                      {invoice.daysOverdue} {invoice.daysOverdue === 1 ? "day" : "days"} overdue
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
