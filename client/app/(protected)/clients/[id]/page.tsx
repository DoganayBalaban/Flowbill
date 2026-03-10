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
import {
  ArrowLeft,
  Banknote,
  Building2,
  Clock,
  FileText,
  FolderOpen,
  Mail,
  MapPin,
  Pencil,
  Phone,
  StickyNote,
  Timer,
  TrendingUp,
  User,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getProjectStatusLabel(status: string) {
  const map: Record<string, string> = {
    active: "Active",
    on_hold: "On Hold",
    completed: "Completed",
    cancelled: "Cancelled",
  };
  return map[status] || status;
}

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

function getInvoiceStatusLabel(status: string) {
  const map: Record<string, string> = {
    draft: "Draft",
    sent: "Sent",
    paid: "Paid",
    overdue: "Overdue",
    cancelled: "Cancelled",
  };
  return map[status] || status;
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
          <p className="text-destructive font-medium">Client not found</p>
          <Button variant="outline" onClick={() => router.push("/clients")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Clients
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
            Edit
          </Button>
        </div>

        {/* Client Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5" />
              Client Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <InfoItem
                icon={<Mail className="h-4 w-4" />}
                label="Email"
                value={client.email}
              />
              <InfoItem
                icon={<Phone className="h-4 w-4" />}
                label="Phone"
                value={client.phone}
              />
              <InfoItem
                icon={<Clock className="h-4 w-4" />}
                label="Hourly Rate"
                value={
                  client.hourly_rate ? formatCurrency(client.hourly_rate) : null
                }
              />
              <InfoItem
                icon={<MapPin className="h-4 w-4" />}
                label="Address"
                value={client.address}
              />
              {client.notes && (
                <div className="sm:col-span-2 lg:col-span-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <StickyNote className="h-4 w-4" />
                    Notes
                  </div>
                  <p className="text-sm">{client.notes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="projects">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="projects" className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              Projects
            </TabsTrigger>
            <TabsTrigger value="invoices" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Invoices
            </TabsTrigger>
            <TabsTrigger
              value="time-entries"
              className="flex items-center gap-2"
            >
              <Timer className="h-4 w-4" />
              Time
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Stats
            </TabsTrigger>
            <TabsTrigger value="revenue" className="flex items-center gap-2">
              <Banknote className="h-4 w-4" />
              Revenue
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
            No projects found for this client.
          </p>
        </CardContent>
      </Card>
    );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Projects</CardTitle>
        <CardDescription>{projects.length} {projects.length === 1 ? "project" : "projects"}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Budget</TableHead>
                <TableHead className="hidden md:table-cell">
                  Start Date
                </TableHead>
                <TableHead className="hidden lg:table-cell">
                  Deadline
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">{project.name}</TableCell>
                  <TableCell>
                    <Badge variant={getProjectStatusVariant(project.status)}>
                      {getProjectStatusLabel(project.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {formatCurrency(project.budget)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {formatDate(project.start_date)}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {/* backend field is 'deadline', not 'end_date' */}
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
            No invoices found for this client.
          </p>
        </CardContent>
      </Card>
    );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Invoices</CardTitle>
        <CardDescription>{invoices.length} {invoices.length === 1 ? "invoice" : "invoices"}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="hidden md:table-cell">
                  Issue Date
                </TableHead>
                <TableHead className="hidden md:table-cell">
                  Due Date
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
                      {getInvoiceStatusLabel(invoice.status)}
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
            No time entries found for this client.
          </p>
        </CardContent>
      </Card>
    );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Time Entries</CardTitle>
        <CardDescription>
          {data?.meta.total ?? entries.length} {(data?.meta.total ?? entries.length) === 1 ? "entry" : "entries"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="hidden md:table-cell">Project</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead className="hidden md:table-cell">
                  Billable
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
                      <Badge variant="default">Yes</Badge>
                    ) : (
                      <Badge variant="outline">No</Badge>
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
            Failed to load stats.
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
            Invoice Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Collection progress</span>
            <span className="font-medium">
              {stats.paid_invoice_count}/{stats.total_invoice_count} invoices paid
            </span>
          </div>
          <Progress value={invoicePaidPercent} className="h-2" />
          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.total_invoice_count}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.open_invoice_count}</p>
              <p className="text-xs text-muted-foreground">Open</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.paid_invoice_count}</p>
              <p className="text-xs text-muted-foreground">Paid</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.total_revenue)}
          description="Total invoiced amount"
          icon={<TrendingUp className="h-5 w-5 text-emerald-500" />}
        />
        <StatCard
          title="Collected"
          value={formatCurrency(stats.total_paid)}
          description="Total payments received"
          icon={<Banknote className="h-5 w-5 text-blue-500" />}
        />
        <StatCard
          title="Outstanding"
          value={formatCurrency(stats.outstanding)}
          description="Unpaid amount"
          icon={<Clock className="h-5 w-5 text-amber-500" />}
          highlight={stats.outstanding > 0}
        />
        <StatCard
          title="Projects"
          value={stats.project_count.toString()}
          description="Active projects"
          icon={<FolderOpen className="h-5 w-5 text-purple-500" />}
        />
        <StatCard
          title="Hours Tracked"
          value={`${stats.total_tracked_hours}h`}
          description={`${stats.time_entry_count} time entries`}
          icon={<Timer className="h-5 w-5 text-indigo-500" />}
        />
      </div>
    </div>
  );
}

function RevenueTab({ clientId }: { clientId: string }) {
  // Revenue is a subset of stats — reuse for a lightweight view
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
            Failed to load revenue data.
          </p>
        </CardContent>
      </Card>
    );

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard
        title="Total Revenue"
        value={formatCurrency(stats.total_revenue)}
        description="Revenue from all invoices"
        icon={<TrendingUp className="h-5 w-5 text-emerald-500" />}
      />
      <StatCard
        title="Total Collected"
        value={formatCurrency(stats.total_paid)}
        description="Total payments received"
        icon={<Banknote className="h-5 w-5 text-blue-500" />}
      />
      <StatCard
        title="Outstanding"
        value={formatCurrency(stats.outstanding)}
        description="Unpaid amount"
        icon={<Clock className="h-5 w-5 text-amber-500" />}
        highlight={stats.outstanding > 0}
      />
      <StatCard
        title="Total Invoices"
        value={stats.total_invoice_count.toString()}
        description="Invoices issued"
        icon={<FileText className="h-5 w-5 text-muted-foreground" />}
      />
      <StatCard
        title="Paid Invoices"
        value={stats.paid_invoice_count.toString()}
        description="Fully paid invoices"
        icon={<FileText className="h-5 w-5 text-emerald-500" />}
      />
    </div>
  );
}
