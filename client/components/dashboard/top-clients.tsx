"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useClients } from "@/lib/hooks/useClients";
import { Crown, TrendingUp, Users } from "lucide-react";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function TopClients() {
  const { data, isLoading } = useClients({
    sort: "created_at",
    order: "desc",
    limit: 5,
  });

  const clients = data?.clients || [];

  // Sort by total_revenue descending on the client side
  const sortedClients = [...clients].sort(
    (a, b) => (b.total_revenue || 0) - (a.total_revenue || 0),
  );

  return (
    <Card className="border transition-all duration-300 hover:shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Crown className="h-5 w-5 text-amber-500" />
          Top Clients
        </CardTitle>
        <CardDescription>Clients by total revenue</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-28 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        ) : sortedClients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="p-3 rounded-full bg-muted mb-3">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">No clients yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Add your first client to get started
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedClients.map((client, index) => {
              // Calculate the max revenue for relative bar width
              const maxRevenue = sortedClients[0]?.total_revenue || 1;
              const percentage = Math.round(
                ((client.total_revenue || 0) / maxRevenue) * 100,
              );

              return (
                <div
                  key={client.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  {/* Rank indicator */}
                  <div
                    className={`flex items-center justify-center h-9 w-9 rounded-full shrink-0 text-sm font-bold
                      ${
                        index === 0
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          : index === 1
                            ? "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                            : index === 2
                              ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                              : "bg-muted text-muted-foreground"
                      }`}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {client.name}
                    </p>
                    {client.company && (
                      <p className="text-xs text-muted-foreground truncate">
                        {client.company}
                      </p>
                    )}
                    {/* Tiny bar chart */}
                    <div className="mt-1 h-1 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                      {formatCurrency(client.total_revenue || 0)}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground justify-end">
                      <TrendingUp className="h-3 w-3" />
                      {client._count?.projects || 0} {(client._count?.projects || 0) === 1 ? "project" : "projects"}
                    </div>
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
