"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ActivityItem } from "@/lib/api/dashboard";
import {
  Clock,
  DollarSign,
  FileText,
  FolderOpen,
  Pencil,
  Plus,
  Trash2,
  Users,
} from "lucide-react";

interface RecentActivityProps {
  data: ActivityItem[] | undefined;
  isLoading: boolean;
}

function getActivityMeta(type: string) {
  const lower = type.toLowerCase();

  // Entity-based icon
  let icon = Clock;
  let color = "text-slate-500";
  let bg = "bg-slate-100 dark:bg-slate-800";

  if (lower.includes("invoice")) {
    icon = FileText;
    color = "text-blue-600 dark:text-blue-400";
    bg = "bg-blue-100 dark:bg-blue-900/30";
  } else if (lower.includes("project")) {
    icon = FolderOpen;
    color = "text-violet-600 dark:text-violet-400";
    bg = "bg-violet-100 dark:bg-violet-900/30";
  } else if (lower.includes("client")) {
    icon = Users;
    color = "text-emerald-600 dark:text-emerald-400";
    bg = "bg-emerald-100 dark:bg-emerald-900/30";
  } else if (lower.includes("timer") || lower.includes("time_entry")) {
    icon = Clock;
    color = "text-amber-600 dark:text-amber-400";
    bg = "bg-amber-100 dark:bg-amber-900/30";
  } else if (lower.includes("payment")) {
    icon = DollarSign;
    color = "text-green-600 dark:text-green-400";
    bg = "bg-green-100 dark:bg-green-900/30";
  }

  // Action-based secondary icon
  let actionIcon = Plus;
  if (lower.includes("update")) {
    actionIcon = Pencil;
  } else if (lower.includes("delete")) {
    actionIcon = Trash2;
  }

  // Label
  const entityLabels: Record<string, string> = {
    invoice: "Invoice",
    project: "Project",
    client: "Client",
    timer: "Timer",
    time_entry: "Time entry",
    payment: "Payment",
    task: "Task",
  };

  const actionLabels: Record<string, string> = {
    create: "created",
    update: "updated",
    delete: "deleted",
  };

  let entity = type;
  let action = "";

  for (const [key, label] of Object.entries(entityLabels)) {
    if (lower.includes(key)) {
      entity = label;
      break;
    }
  }

  for (const [key, label] of Object.entries(actionLabels)) {
    if (lower.includes(key)) {
      action = label;
      break;
    }
  }

  const label = action ? `${entity} ${action}` : entity;

  return { icon, actionIcon, color, bg, label };
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
  }).format(date);
}

export function RecentActivity({ data, isLoading }: RecentActivityProps) {
  return (
    <Card className="border transition-all duration-300 hover:shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
        <CardDescription>Latest actions across your workspace</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : !data || data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="p-3 rounded-full bg-muted mb-3">
              <Clock className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">No activity yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Your actions will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {data.map((item, index) => {
              const meta = getActivityMeta(item.type);
              const Icon = meta.icon;
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className={`p-2 rounded-full ${meta.bg} shrink-0`}>
                    <Icon className={`h-4 w-4 ${meta.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{meta.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {timeAgo(item.createdAt)}
                    </p>
                  </div>
                  {index < data.length - 1 && (
                    <div className="absolute left-[29px] mt-10 h-4 w-px bg-border" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
