"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/lib/i18n/context";
import { TimeEntry, TimeReportParams } from "@/lib/api/timeEntries";
import { useProjects } from "@/lib/hooks/useProjects";
import {
  useActiveTimer,
  useCreateManualTimeEntry,
  useDeleteTimeEntry,
  useStartTimer,
  useStopTimer,
  useTimeReport,
  useUpdateTimeEntry,
} from "@/lib/hooks/useTimeEntries";
import {
  Clock,
  Loader2,
  Play,
  Plus,
  Square,
  Timer,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(minutes: number | null | undefined) {
  if (!minutes) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function formatCurrency(amount: number | null | undefined) {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(amount));
}

/** Convert minutes to "Xh Ym" string for report summaries */
function minutesToLabel(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

// ─── Live Elapsed Clock ────────────────────────────────────────────────────────

function useLiveElapsed(startedAt: string | null | undefined) {
  const [elapsed, setElapsed] = useState("00:00:00");

  useEffect(() => {
    if (!startedAt) return;
    const calc = () => {
      const diff = Date.now() - new Date(startedAt).getTime();
      const s = Math.floor(diff / 1000) % 60;
      const m = Math.floor(diff / 60000) % 60;
      const h = Math.floor(diff / 3600000);
      setElapsed(
        `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`,
      );
    };
    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  return elapsed;
}

// ─── Active Timer Card ─────────────────────────────────────────────────────────

function ActiveTimerCard() {
  const { data: active, isLoading } = useActiveTimer();
  const stopTimer = useStopTimer();
  const elapsed = useLiveElapsed(active?.started_at ?? null);
  const { t } = useTranslation();

  if (isLoading) return <Skeleton className="h-28 w-full" />;

  if (!active)
    return (
      <Card className="border-dashed">
        <CardContent className="flex items-center gap-3 py-5 text-muted-foreground">
          <Timer className="h-5 w-5" />
          <span className="text-sm">{t("time_entries.no_active_timer")}</span>
        </CardContent>
      </Card>
    );

  return (
    <Card className="border-green-500/60 bg-green-500/5">
      <CardContent className="flex items-center justify-between py-5">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/20 animate-pulse">
            <Timer className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="font-semibold text-lg tracking-widest font-mono">
              {elapsed}
            </p>
            <p className="text-sm text-muted-foreground line-clamp-1">
              {active.project?.name ?? "—"}
              {active.description ? ` · ${active.description}` : ""}
            </p>
          </div>
        </div>
        <Button
          variant="destructive"
          size="sm"
          disabled={stopTimer.isPending}
          onClick={() => stopTimer.mutate(active.id)}
        >
          {stopTimer.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Square className="h-4 w-4" />
          )}
          <span className="ml-2">{t("time_entries.stop_timer")}</span>
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Start Timer Dialog ────────────────────────────────────────────────────────

function StartTimerDialog() {
  const [open, setOpen] = useState(false);
  const [projectId, setProjectId] = useState("");
  const [description, setDescription] = useState("");
  const [billable, setBillable] = useState(true);
  const { t } = useTranslation();

  const { data: projectsData } = useProjects({
    limit: 100,
    sort: "name",
    order: "asc",
  });
  const startTimer = useStartTimer();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;
    startTimer.mutate(
      { projectId, description: description || undefined, billable },
      {
        onSuccess: () => {
          setOpen(false);
          setProjectId("");
          setDescription("");
          setBillable(true);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Play className="mr-2 h-4 w-4" />
          {t("time_entries.start_timer")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("time_entries.start_timer")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="project">{t("time_entries.project_required")}</Label>
            <Select value={projectId} onValueChange={setProjectId} required>
              <SelectTrigger id="project">
                <SelectValue placeholder={t("time_entries.select_project")} />
              </SelectTrigger>
              <SelectContent>
                {projectsData?.projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">{t("time_entries.description_label")}</Label>
            <Input
              id="description"
              placeholder={t("time_entries.description_placeholder")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="billable"
              checked={billable}
              onChange={(e) => setBillable(e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="billable" className="cursor-pointer">
              {t("time_entries.billable")}
            </Label>
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={!projectId || startTimer.isPending}
          >
            {startTimer.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            {t("time_entries.start_btn")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Manual Entry Dialog ──────────────────────────────────────────────────────

function ManualEntryDialog({
  open,
  onOpenChange,
  entry,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  entry?: TimeEntry | null;
}) {
  const { data: projectsData } = useProjects({
    limit: 100,
    sort: "name",
    order: "asc",
  });
  const createManual = useCreateManualTimeEntry();
  const updateEntry = useUpdateTimeEntry();

  const isEdit = !!entry;

  const toLocal = (iso: string | null | undefined) => {
    if (!iso) return "";
    const d = new Date(iso);
    // Convert to local datetime-local string
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().slice(0, 16);
  };

  const [projectId, setProjectId] = useState(entry?.project_id ?? "");
  const [description, setDescription] = useState(entry?.description ?? "");
  const [startedAt, setStartedAt] = useState(toLocal(entry?.started_at));
  const [endedAt, setEndedAt] = useState(toLocal(entry?.ended_at));
  const [billable, setBillable] = useState(entry?.billable ?? true);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setProjectId(entry?.project_id ?? "");
    setDescription(entry?.description ?? "");
    setStartedAt(toLocal(entry?.started_at));
    setEndedAt(toLocal(entry?.ended_at));
    setBillable(entry?.billable ?? true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [entry]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      projectId,
      description: description || undefined,
      started_at: new Date(startedAt).toISOString(),
      ended_at: new Date(endedAt).toISOString(),
      billable,
    };
    if (isEdit) {
      updateEntry.mutate(
        { id: entry!.id, data: payload },
        { onSuccess: () => onOpenChange(false) },
      );
    } else {
      createManual.mutate(payload, { onSuccess: () => onOpenChange(false) });
    }
  };

  const isPending = createManual.isPending || updateEntry.isPending;
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t("time_entries.edit_entry") : t("time_entries.add_manual_entry")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>{t("time_entries.project_required")}</Label>
            <Select value={projectId} onValueChange={setProjectId} required>
              <SelectTrigger>
                <SelectValue placeholder={t("time_entries.select_project")} />
              </SelectTrigger>
              <SelectContent>
                {projectsData?.projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("time_entries.description_label")}</Label>
            <Input
              placeholder={t("time_entries.description_work")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t("time_entries.start_label")}</Label>
              <Input
                type="datetime-local"
                required
                value={startedAt}
                onChange={(e) => setStartedAt(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("time_entries.end_label")}</Label>
              <Input
                type="datetime-local"
                required
                value={endedAt}
                onChange={(e) => setEndedAt(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="billable-manual"
              checked={billable}
              onChange={(e) => setBillable(e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="billable-manual" className="cursor-pointer">
              {t("time_entries.billable")}
            </Label>
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={!projectId || !startedAt || !endedAt || isPending}
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            {isEdit ? t("time_entries.save_changes") : t("time_entries.add_btn")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Report Tab ───────────────────────────────────────────────────────────────

function ReportTab() {
  const [params, setParams] = useState<TimeReportParams>({});
  const { data: report, isLoading } = useTimeReport(params);
  const { data: projectsData } = useProjects({
    limit: 100,
    sort: "name",
    order: "asc",
  });
  const { t } = useTranslation();

  if (isLoading)
    return (
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );

  if (!report) return null;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3">
            <Input
              type="date"
              className="w-44"
              placeholder="Start"
              onChange={(e) =>
                setParams((p) => ({
                  ...p,
                  start_date: e.target.value || undefined,
                }))
              }
            />
            <Input
              type="date"
              className="w-44"
              placeholder="End"
              onChange={(e) =>
                setParams((p) => ({
                  ...p,
                  end_date: e.target.value || undefined,
                }))
              }
            />
            <Select
              value={params.project_id ?? "all"}
              onValueChange={(v) =>
                setParams((p) => ({
                  ...p,
                  project_id: v === "all" ? undefined : v,
                }))
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder={t("time_entries.all_projects")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("time_entries.all_projects")}</SelectItem>
                {projectsData?.projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("time_entries.total_duration")}
            </CardTitle>
            <Clock className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {minutesToLabel(report.total_minutes)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{t("time_entries.all_entries")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("time_entries.billable_duration")}
            </CardTitle>
            <Timer className="h-5 w-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {minutesToLabel(report.total_billable_minutes)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {report.total_minutes > 0
                ? `${Math.round((report.total_billable_minutes / report.total_minutes) * 100)}%`
                : "—"}{" "}
              {t("time_entries.billable_pct")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("time_entries.total_revenue")}
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(report.total_revenue)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("time_entries.based_on_rate")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Per-project breakdown */}
      {report.projects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("time_entries.project_breakdown")}</CardTitle>
            <CardDescription>
              {t(report.projects.length === 1 ? "projects.projects_found_one" : "projects.projects_found_other", { count: report.projects.length })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("time_entries.col_project")}</TableHead>
                    <TableHead>{t("time_entries.col_total_duration")}</TableHead>
                    <TableHead>{t("time_entries.col_billable")}</TableHead>
                    <TableHead>{t("time_entries.col_revenue")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.projects.map((p) => {
                    const proj = projectsData?.projects.find(
                      (x) => x.id === p.project_id,
                    );
                    return (
                      <TableRow key={p.project_id}>
                        <TableCell className="font-medium">
                          {proj?.name ?? p.project_id.slice(0, 8) + "…"}
                        </TableCell>
                        <TableCell>{minutesToLabel(p.total_minutes)}</TableCell>
                        <TableCell>
                          {minutesToLabel(p.billable_minutes)}
                        </TableCell>
                        <TableCell>{formatCurrency(p.revenue)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Entries List Tab ─────────────────────────────────────────────────────────
// Note: The backend doesn't have a paginated GET /time-entries list endpoint yet.
// We show the time report entries breakdown (per-project) and rely on project/client
// detail pages for per-entry lists. The tab shows the report summary by default.
// Once the backend adds a list endpoint, replace this with a proper paginated table.

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TimeEntriesPage() {
  const [manualOpen, setManualOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const deleteEntry = useDeleteTimeEntry();
  const { t } = useTranslation();

  const handleDelete = (id: string) => {
    if (confirm(t("time_entries.confirm_delete"))) {
      deleteEntry.mutate(id);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Timer className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {t("time_entries.title")}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t("time_entries.subtitle")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setEditingEntry(null);
                setManualOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              {t("time_entries.add_manual")}
            </Button>
            <StartTimerDialog />
          </div>
        </div>

        {/* Active Timer */}
        <ActiveTimerCard />

        {/* Tabs */}
        <Tabs defaultValue="report">
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="report" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              {t("time_entries.tab_report")}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="report" className="mt-4">
            <ReportTab />
          </TabsContent>
        </Tabs>
      </div>

      {/* Manual / Edit Dialog */}
      <ManualEntryDialog
        open={manualOpen || !!editingEntry}
        onOpenChange={(v) => {
          setManualOpen(v);
          if (!v) setEditingEntry(null);
        }}
        entry={editingEntry}
      />

      {/* Delete loading overlay */}
      {deleteEntry.isPending && (
        <div className="fixed inset-0 bg-background/50 flex items-center justify-center z-50">
          <div className="flex items-center gap-3 bg-card p-4 rounded-lg shadow-lg border">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>{t("common.deleting")}</span>
          </div>
        </div>
      )}
    </div>
  );
}
