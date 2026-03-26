"use client";

import { ClientFormDialog } from "@/components/client-form-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
import {
  useClient,
  useClientInvoices,
  useClientProjects,
  useClientStats,
  useClientTimeEntries,
} from "@/lib/hooks/useClients";
import { clientPortalApi } from "@/lib/api/portal";
import { useTranslation } from "@/lib/i18n/context";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Banknote,
  Building2,
  Clock,
  FileText,
  FolderOpen,
  Globe,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Send,
  StickyNote,
  Timer,
  TrendingUp,
  User,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getProjectStatusVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  const map: Record<
    string,
    "default" | "secondary" | "destructive" | "outline"
  > = {
    active: "default",
    on_hold: "outline",
    completed: "secondary",
    cancelled: "destructive",
  };
  return map[status] || "secondary";
}

function getInvoiceStatusVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  const map: Record<
    string,
    "default" | "secondary" | "destructive" | "outline"
  > = {
    draft: "outline",
    sent: "secondary",
    paid: "default",
    overdue: "destructive",
    cancelled: "destructive",
  };
  return map[status] || "secondary";
}

function formatCurrency(amount: number | null | undefined) {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(amount));
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "—";
  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(dateStr));
}

function formatDuration(minutes: number | null | undefined) {
  if (!minutes) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;
  const { t } = useTranslation();

  const { data: client, isLoading, error } = useClient(clientId);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-destructive font-medium">{t("clients.client_not_found")}</p>
          <Button variant="outline" onClick={() => router.push("/clients")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("clients.back_to_clients")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/clients")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {client.name}
              </h1>
              {client.company && (
                <p className="text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  <Building2 className="h-3.5 w-3.5" />
                  {client.company}
                </p>
              )}
            </div>
          </div>
          <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            {t("common.edit")}
          </Button>
        </div>

        {/* Client Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5" />
              {t("clients.client_details")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <InfoItem
                icon={<Mail className="h-4 w-4" />}
                label={t("clients.col_email")}
                value={client.email}
              />
              <InfoItem
                icon={<Phone className="h-4 w-4" />}
                label={t("clients.col_phone")}
                value={client.phone}
              />
              <InfoItem
                icon={<Clock className="h-4 w-4" />}
                label={t("clients.col_hourly_rate")}
                value={
                  client.hourly_rate ? formatCurrency(client.hourly_rate) : null
                }
              />
              <InfoItem
                icon={<MapPin className="h-4 w-4" />}
                label={t("clients.col_address")}
                value={client.address}
              />
              {client.notes && (
                <div className="sm:col-span-2 lg:col-span-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <StickyNote className="h-4 w-4" />
                    {t("clients.col_notes")}
                  </div>
                  <p className="text-sm">{client.notes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="projects">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="projects" className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              {t("clients.tab_projects")}
            </TabsTrigger>
            <TabsTrigger value="invoices" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {t("clients.tab_invoices")}
            </TabsTrigger>
            <TabsTrigger
              value="time-entries"
              className="flex items-center gap-2"
            >
              <Timer className="h-4 w-4" />
              {t("clients.tab_time")}
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              {t("clients.tab_stats")}
            </TabsTrigger>
            <TabsTrigger value="revenue" className="flex items-center gap-2">
              <Banknote className="h-4 w-4" />
              {t("clients.tab_revenue")}
            </TabsTrigger>
            <TabsTrigger value="portal" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              {t("clients.tab_portal")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="mt-4">
            <ProjectsTab clientId={clientId} />
          </TabsContent>
          <TabsContent value="invoices" className="mt-4">
            <InvoicesTab clientId={clientId} />
          </TabsContent>
          <TabsContent value="time-entries" className="mt-4">
            <TimeEntriesTab clientId={clientId} />
          </TabsContent>
          <TabsContent value="stats" className="mt-4">
            <StatsTab clientId={clientId} />
          </TabsContent>
          <TabsContent value="revenue" className="mt-4">
            <RevenueTab clientId={clientId} />
          </TabsContent>
          <TabsContent value="portal" className="mt-4">
            <PortalTab clientId={clientId} client={client} />
          </TabsContent>
        </Tabs>
      </div>

      <ClientFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        client={client}
      />
    </div>
  );
}

// ─── Shared Components ────────────────────────────────────────────────────────

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
        {icon}
        {label}
      </div>
      <p className="font-medium">{value || "—"}</p>
    </div>
  );
}

function StatCard({
  title,
  value,
  description,
  icon,
  highlight = false,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <Card className={highlight ? "border-amber-500/50" : ""}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

// ─── Tab Components ───────────────────────────────────────────────────────────

function ProjectsTab({ clientId }: { clientId: string }) {
  const { t } = useTranslation();
  const { data: projects, isLoading } = useClientProjects(clientId);

  if (isLoading)
    return (
      <Card>
        <CardContent className="pt-6 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </CardContent>
      </Card>
    );

  if (!projects || projects.length === 0)
    return (
      <Card>
        <CardContent className="pt-6 text-center py-12 space-y-2">
          <FolderOpen className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="text-muted-foreground">
            {t("clients.no_projects_for_client")}
          </p>
        </CardContent>
      </Card>
    );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t("clients.tab_projects")}</CardTitle>
        <CardDescription>
          {projects.length === 1
            ? t("projects.projects_found_one", { count: String(projects.length) })
            : t("projects.projects_found_other", { count: String(projects.length) })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("projects.col_project_name")}</TableHead>
                <TableHead>{t("projects.col_status")}</TableHead>
                <TableHead className="hidden md:table-cell">{t("projects.col_budget")}</TableHead>
                <TableHead className="hidden md:table-cell">
                  {t("clients.col_start_date")}
                </TableHead>
                <TableHead className="hidden lg:table-cell">
                  {t("projects.col_deadline")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">{project.name}</TableCell>
                  <TableCell>
                    <Badge variant={getProjectStatusVariant(project.status)}>
                      {t(`projects.status_${project.status}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {formatCurrency(project.budget)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {formatDate(project.start_date)}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {formatDate(project.deadline)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function InvoicesTab({ clientId }: { clientId: string }) {
  const { t } = useTranslation();
  const { data: invoices, isLoading } = useClientInvoices(clientId);

  if (isLoading)
    return (
      <Card>
        <CardContent className="pt-6 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </CardContent>
      </Card>
    );

  if (!invoices || invoices.length === 0)
    return (
      <Card>
        <CardContent className="pt-6 text-center py-12 space-y-2">
          <FileText className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="text-muted-foreground">
            {t("clients.no_invoices_for_client")}
          </p>
        </CardContent>
      </Card>
    );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t("clients.tab_invoices")}</CardTitle>
        <CardDescription>
          {invoices.length === 1
            ? t("invoices.invoices_found_one", { count: String(invoices.length) })
            : t("invoices.invoices_found_other", { count: String(invoices.length) })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("invoices.col_invoice_number")}</TableHead>
                <TableHead>{t("invoices.col_status")}</TableHead>
                <TableHead>{t("invoices.col_amount")}</TableHead>
                <TableHead className="hidden md:table-cell">
                  {t("clients.col_issue_date")}
                </TableHead>
                <TableHead className="hidden md:table-cell">
                  {t("clients.col_due_date")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium font-mono text-sm">
                    {invoice.invoice_number}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getInvoiceStatusVariant(invoice.status)}>
                      {t(`invoices.status_${invoice.status}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(invoice.total)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {formatDate(invoice.issue_date)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {formatDate(invoice.due_date)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function TimeEntriesTab({ clientId }: { clientId: string }) {
  const { t } = useTranslation();
  const { data, isLoading } = useClientTimeEntries(clientId);
  const entries = data?.data;

  if (isLoading)
    return (
      <Card>
        <CardContent className="pt-6 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </CardContent>
      </Card>
    );

  if (!entries || entries.length === 0)
    return (
      <Card>
        <CardContent className="pt-6 text-center py-12 space-y-2">
          <Timer className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="text-muted-foreground">
            {t("clients.no_time_entries_for_client")}
          </p>
        </CardContent>
      </Card>
    );

  const total = data?.meta.total ?? entries.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t("clients.tab_time")}</CardTitle>
        <CardDescription>
          {t("clients.stat_time_entries", { count: String(total) })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("expenses.col_date")}</TableHead>
                <TableHead>{t("expenses.col_description")}</TableHead>
                <TableHead className="hidden md:table-cell">{t("time_entries.col_project")}</TableHead>
                <TableHead>{t("clients.col_duration")}</TableHead>
                <TableHead className="hidden md:table-cell">
                  {t("time_entries.col_billable")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">
                    {formatDate(entry.started_at)}
                  </TableCell>
                  <TableCell>
                    <span className="line-clamp-1">
                      {entry.description || "—"}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {entry.project ? (
                      <Badge variant="secondary">{entry.project.name}</Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {formatDuration(entry.duration_minutes)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {entry.billable ? (
                      <Badge variant="default">{t("expenses.yes")}</Badge>
                    ) : (
                      <Badge variant="outline">{t("expenses.no")}</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function StatsTab({ clientId }: { clientId: string }) {
  const { t } = useTranslation();
  const { data: stats, isLoading } = useClientStats(clientId);

  if (isLoading)
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );

  if (!stats)
    return (
      <Card>
        <CardContent className="pt-6 text-center py-12">
          <TrendingUp className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="text-muted-foreground mt-2">
            {t("clients.failed_to_load_stats")}
          </p>
        </CardContent>
      </Card>
    );

  const invoicePaidPercent =
    stats.total_invoice_count > 0
      ? (stats.paid_invoice_count / stats.total_invoice_count) * 100
      : 0;

  return (
    <div className="space-y-4">
      {/* Invoice progress */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t("clients.invoice_status_title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t("clients.collection_progress")}</span>
            <span className="font-medium">
              {stats.paid_invoice_count}/{stats.total_invoice_count} {t("clients.invoices_paid_label")}
            </span>
          </div>
          <Progress value={invoicePaidPercent} className="h-2" />
          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.total_invoice_count}</p>
              <p className="text-xs text-muted-foreground">{t("invoices.stat_total")}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.open_invoice_count}</p>
              <p className="text-xs text-muted-foreground">{t("clients.stat_open")}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.paid_invoice_count}</p>
              <p className="text-xs text-muted-foreground">{t("invoices.stat_paid")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title={t("clients.stat_total_revenue")}
          value={formatCurrency(stats.total_revenue)}
          description={t("clients.stat_total_invoiced")}
          icon={<TrendingUp className="h-5 w-5 text-emerald-500" />}
        />
        <StatCard
          title={t("clients.stat_collected")}
          value={formatCurrency(stats.total_paid)}
          description={t("clients.stat_total_payments")}
          icon={<Banknote className="h-5 w-5 text-blue-500" />}
        />
        <StatCard
          title={t("clients.stat_outstanding")}
          value={formatCurrency(stats.outstanding)}
          description={t("clients.stat_unpaid_amount")}
          icon={<Clock className="h-5 w-5 text-amber-500" />}
          highlight={stats.outstanding > 0}
        />
        <StatCard
          title={t("clients.stat_projects_label")}
          value={stats.project_count.toString()}
          description={t("clients.stat_active_projects")}
          icon={<FolderOpen className="h-5 w-5 text-purple-500" />}
        />
        <StatCard
          title={t("clients.stat_hours_tracked")}
          value={`${stats.total_tracked_hours}h`}
          description={t("clients.stat_time_entries", { count: String(stats.time_entry_count) })}
          icon={<Timer className="h-5 w-5 text-indigo-500" />}
        />
      </div>
    </div>
  );
}

function PortalTab({
  clientId,
  client,
}: {
  clientId: string;
  client: {
    id: string;
    email?: string | null;
    portal_enabled?: boolean;
  };
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const enableMutation = useMutation({
    mutationFn: () => clientPortalApi.enablePortal(clientId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients", clientId] });
      setSuccessMsg(t("clients.portal_enabled_success"));
      setErrorMsg(null);
    },
    onError: () => {
      setErrorMsg(t("clients.portal_enable_error"));
      setSuccessMsg(null);
    },
  });

  const disableMutation = useMutation({
    mutationFn: () => clientPortalApi.disablePortal(clientId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients", clientId] });
      setSuccessMsg(t("clients.portal_disabled_success"));
      setErrorMsg(null);
    },
    onError: () => {
      setErrorMsg(t("clients.portal_disable_error"));
      setSuccessMsg(null);
    },
  });

  const sendLinkMutation = useMutation({
    mutationFn: () => clientPortalApi.sendMagicLink(clientId),
    onSuccess: () => {
      setSuccessMsg(t("clients.portal_link_sent"));
      setErrorMsg(null);
    },
    onError: () => {
      setErrorMsg(t("clients.portal_link_error"));
      setSuccessMsg(null);
    },
  });

  const isPortalEnabled = client?.portal_enabled ?? false;
  const hasEmail = !!client?.email;
  const isBusy =
    enableMutation.isPending ||
    disableMutation.isPending ||
    sendLinkMutation.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Globe className="h-5 w-5" />
          {t("clients.portal_title")}
        </CardTitle>
        <CardDescription>
          {t("clients.portal_desc")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{t("clients.portal_status")}</span>
          {isPortalEnabled ? (
            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400">
              {t("clients.portal_active")}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
              {t("clients.portal_disabled_label")}
            </Badge>
          )}
        </div>

        {/* Feedback messages */}
        {successMsg && (
          <p className="text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-md px-4 py-3">
            {successMsg}
          </p>
        )}
        {errorMsg && (
          <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md px-4 py-3">
            {errorMsg}
          </p>
        )}

        {/* Actions */}
        {!isPortalEnabled ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {t("clients.portal_enable_desc")}
            </p>
            <Button
              onClick={() => enableMutation.mutate()}
              disabled={isBusy}
            >
              {enableMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t("clients.portal_enable")}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t("clients.portal_enabled_desc")}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={() => sendLinkMutation.mutate()}
                disabled={isBusy || !hasEmail}
              >
                {sendLinkMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                {t("clients.portal_send_link")}
              </Button>

              <Button
                variant="destructive"
                onClick={() => disableMutation.mutate()}
                disabled={isBusy}
              >
                {disableMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t("clients.portal_disable")}
              </Button>
            </div>

            {!hasEmail && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                {t("clients.portal_no_email")}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RevenueTab({ clientId }: { clientId: string }) {
  const { t } = useTranslation();
  const { data: stats, isLoading } = useClientStats(clientId);

  if (isLoading)
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );

  if (!stats)
    return (
      <Card>
        <CardContent className="pt-6 text-center py-12">
          <TrendingUp className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="text-muted-foreground mt-2">
            {t("clients.failed_to_load_revenue")}
          </p>
        </CardContent>
      </Card>
    );

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard
        title={t("clients.stat_total_revenue")}
        value={formatCurrency(stats.total_revenue)}
        description={t("clients.stat_revenue_from_invoices")}
        icon={<TrendingUp className="h-5 w-5 text-emerald-500" />}
      />
      <StatCard
        title={t("clients.stat_total_collected")}
        value={formatCurrency(stats.total_paid)}
        description={t("clients.stat_total_payments")}
        icon={<Banknote className="h-5 w-5 text-blue-500" />}
      />
      <StatCard
        title={t("clients.stat_outstanding")}
        value={formatCurrency(stats.outstanding)}
        description={t("clients.stat_unpaid_amount")}
        icon={<Clock className="h-5 w-5 text-amber-500" />}
        highlight={stats.outstanding > 0}
      />
      <StatCard
        title={t("clients.stat_total_invoices")}
        value={stats.total_invoice_count.toString()}
        description={t("clients.stat_invoices_issued")}
        icon={<FileText className="h-5 w-5 text-muted-foreground" />}
      />
      <StatCard
        title={t("clients.stat_paid_invoices")}
        value={stats.paid_invoice_count.toString()}
        description={t("clients.stat_fully_paid")}
        icon={<FileText className="h-5 w-5 text-emerald-500" />}
      />
    </div>
  );
}
