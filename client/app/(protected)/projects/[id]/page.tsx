"use client";

import {
  KanbanBoard,
  KanbanCard,
  KanbanCards,
  KanbanHeader,
  KanbanProvider,
  type DragEndEvent,
  type KanbanColumn,
  type KanbanItem,
} from "@/components/kibo-ui/kanban";
import { ProjectFormDialog } from "@/components/project-form-dialog";
import { TaskFormDialog } from "@/components/task-form-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Task } from "@/lib/api/projects";
import {
  useProject,
  useProjectStats,
  useProjectTasks,
  useProjectTimeEntries,
} from "@/lib/hooks/useProjects";
import { useDeleteTask, useUpdateTask } from "@/lib/hooks/useTasks";
import {
  ArrowLeft,
  Banknote,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  FolderOpen,
  ListTodo,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Receipt,
  Timer,
  Trash2,
  TrendingUp,
  User,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Kanban task item type (Task + column field for drag-and-drop)
type KanbanTaskItem = Task & KanbanItem;

// Status helpers
function getStatusLabel(status: string) {
  const map: Record<string, string> = {
    active: "Active",
    completed: "Completed",
    on_hold: "On Hold",
    cancelled: "Cancelled",
  };
  return map[status] || status;
}

function getStatusVariant(status: string) {
  const map: Record<
    string,
    "default" | "secondary" | "destructive" | "outline"
  > = {
    active: "default",
    completed: "secondary",
    on_hold: "outline",
    cancelled: "destructive",
  };
  return map[status] || "secondary";
}

function getTaskStatusLabel(status: string) {
  const map: Record<string, string> = {
    todo: "To Do",
    in_progress: "In Progress",
    done: "Done",
  };
  return map[status] || status;
}

function getTaskStatusVariant(status: string) {
  const map: Record<
    string,
    "default" | "secondary" | "destructive" | "outline"
  > = {
    todo: "outline",
    in_progress: "default",
    done: "secondary",
  };
  return map[status] || "secondary";
}

function getPriorityLabel(priority: string) {
  const map: Record<string, string> = {
    low: "Low",
    medium: "Medium",
    high: "High",
  };
  return map[priority] || priority;
}

function getPriorityVariant(priority: string) {
  const map: Record<
    string,
    "default" | "secondary" | "destructive" | "outline"
  > = {
    low: "outline",
    medium: "secondary",
    high: "destructive",
  };
  return map[priority] || "secondary";
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
  if (minutes == null || minutes === 0) return "—";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const { data: project, isLoading, error } = useProject(projectId);
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

  if (error || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-destructive font-medium">Project not found</p>
          <Button variant="outline" onClick={() => router.push("/projects")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
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
              onClick={() => router.push("/projects")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              {project.color && (
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: project.color }}
                />
              )}
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  {project.name}
                </h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant={getStatusVariant(project.status)}>
                    {getStatusLabel(project.status)}
                  </Badge>
                  {project.client && (
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <User className="h-3.5 w-3.5" />
                      {project.client.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </div>

        {/* Project Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FolderOpen className="h-5 w-5" />
              Project Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <InfoItem
                icon={<DollarSign className="h-4 w-4" />}
                label="Budget"
                value={formatCurrency(project.budget)}
              />
              <InfoItem
                icon={<Clock className="h-4 w-4" />}
                label="Hourly Rate"
                value={
                  project.hourly_rate
                    ? formatCurrency(project.hourly_rate)
                    : null
                }
              />
              <InfoItem
                icon={<Calendar className="h-4 w-4" />}
                label="Start Date"
                value={formatDate(project.start_date)}
              />
              <InfoItem
                icon={<Calendar className="h-4 w-4" />}
                label="Deadline"
                value={formatDate(project.deadline)}
              />
              <InfoItem
                icon={<TrendingUp className="h-4 w-4" />}
                label="Total Billed"
                value={formatCurrency(project.total_billed)}
              />
              <InfoItem
                icon={<Timer className="h-4 w-4" />}
                label="Total Tracked Hours"
                value={
                  project.total_tracked_hours
                    ? `${Number(project.total_tracked_hours).toFixed(1)} hrs`
                    : null
                }
              />
              {project.description && (
                <div className="sm:col-span-2 lg:col-span-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <FolderOpen className="h-4 w-4" />
                    Description
                  </div>
                  <p className="text-sm">{project.description}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="tasks">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <ListTodo className="h-4 w-4" />
              Tasks
            </TabsTrigger>
            <TabsTrigger
              value="time-entries"
              className="flex items-center gap-2"
            >
              <Timer className="h-4 w-4" />
              Time Entries
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Statistics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="mt-4">
            <TasksTab projectId={projectId} />
          </TabsContent>
          <TabsContent value="time-entries" className="mt-4">
            <TimeEntriesTab projectId={projectId} />
          </TabsContent>
          <TabsContent value="stats" className="mt-4">
            <StatsTab projectId={projectId} />
          </TabsContent>
        </Tabs>
      </div>

      <ProjectFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        project={project}
      />
    </div>
  );
}

// Info item component
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

// Tasks Tab — Kanban Board
function TasksTab({ projectId }: { projectId: string }) {
  const { data: tasks, isLoading } = useProjectTasks(projectId);
  const updateTask = useUpdateTask(projectId);
  const deleteTask = useDeleteTask(projectId);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const columns: KanbanColumn[] = [
    { id: "todo", name: "To Do", color: "#6B7280" },
    { id: "in_progress", name: "In Progress", color: "#F59E0B" },
    { id: "done", name: "Done", color: "#10B981" },
  ];

  // Map tasks to kanban items
  const kanbanItems: KanbanTaskItem[] = (tasks || []).map((t) => ({
    ...t,
    column: t.status,
  }));

  const [items, setItems] = useState<KanbanTaskItem[]>(kanbanItems);

  // Sync when tasks change
  useEffect(() => {
    setItems((tasks || []).map((t) => ({ ...t, column: t.status })));
  }, [tasks]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active } = event;
    const draggedItem = items.find((i) => i.id === active.id);
    if (!draggedItem) return;

    // If the column changed, call the update API
    if (draggedItem.column !== draggedItem.status) {
      updateTask.mutate({
        id: draggedItem.id,
        data: { status: draggedItem.column as "todo" | "in_progress" | "done" },
      });
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setTaskDialogOpen(true);
  };

  const handleDelete = (taskId: string) => {
    if (confirm("Are you sure you want to delete this task?")) {
      deleteTask.mutate(taskId);
    }
  };

  const handleDialogClose = (open: boolean) => {
    setTaskDialogOpen(open);
    if (!open) setEditingTask(null);
  };

  if (isLoading) {
    return (
      <div className="flex gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex-1 min-w-[280px] space-y-3">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListTodo className="h-5 w-5" />
          <h3 className="font-semibold">Tasks</h3>
          <span className="text-sm text-muted-foreground">
            ({items.length} {items.length === 1 ? "task" : "tasks"})
          </span>
        </div>
        <Button size="sm" onClick={() => setTaskDialogOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          Add Task
        </Button>
      </div>

      {/* Kanban Board */}
      <KanbanProvider
        columns={columns}
        data={items}
        onDataChange={setItems}
        onDragEnd={handleDragEnd}
      >
        {(column) => {
          const columnItems = items.filter((i) => i.column === column.id);
          return (
            <KanbanBoard id={column.id} key={column.id}>
              <KanbanHeader count={columnItems.length}>
                <div className="flex items-center gap-2">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: column.color }}
                  />
                  <span>{column.name}</span>
                </div>
              </KanbanHeader>
              <KanbanCards id={column.id} items={items}>
                {(item: KanbanTaskItem) => (
                  <KanbanCard
                    column={column.id}
                    id={item.id}
                    key={item.id}
                    name={item.title}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-sm leading-tight">
                          {item.title}
                        </p>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 shrink-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(item);
                              }}
                            >
                              <Pencil className="mr-2 h-3.5 w-3.5" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(item.id);
                              }}
                            >
                              <Trash2 className="mr-2 h-3.5 w-3.5" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {item.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {item.description}
                        </p>
                      )}

                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant={getPriorityVariant(item.priority)}
                          className="text-[10px] px-1.5 py-0"
                        >
                          {getPriorityLabel(item.priority)}
                        </Badge>
                        {item.due_date && (
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {formatDate(item.due_date)}
                          </span>
                        )}
                        {item.estimated_hours && (
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {item.estimated_hours}h
                          </span>
                        )}
                      </div>
                    </div>
                  </KanbanCard>
                )}
              </KanbanCards>
            </KanbanBoard>
          );
        }}
      </KanbanProvider>

      {/* Task Form Dialog */}
      <TaskFormDialog
        open={taskDialogOpen}
        onOpenChange={handleDialogClose}
        projectId={projectId}
        task={editingTask}
      />

      {/* Delete loading */}
      {deleteTask.isPending && (
        <div className="fixed inset-0 bg-background/50 flex items-center justify-center z-50">
          <div className="flex items-center gap-3 bg-card p-4 rounded-lg shadow-lg border">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Deleting...</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Time Entries Tab
function TimeEntriesTab({ projectId }: { projectId: string }) {
  const { data: entries, isLoading } = useProjectTimeEntries(projectId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!entries || entries.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12 space-y-2">
            <Timer className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              No time entries for this project.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Time Entries</CardTitle>
        <CardDescription>{entries.length} {entries.length === 1 ? "entry" : "entries"} found</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="hidden md:table-cell">Task</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead className="hidden md:table-cell">
                  Billable
                </TableHead>
                <TableHead className="hidden lg:table-cell">
                  Hourly Rate
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">
                    {formatDate(entry.date)}
                  </TableCell>
                  <TableCell>
                    <span className="line-clamp-1">
                      {entry.description || "—"}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {entry.task ? (
                      <Badge variant="secondary">{entry.task.title}</Badge>
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
                  <TableCell className="hidden lg:table-cell">
                    {formatCurrency(entry.hourly_rate)}
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

// Stats Tab
function StatsTab({ projectId }: { projectId: string }) {
  const { data: stats, isLoading } = useProjectStats(projectId);

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12 space-y-2">
            <TrendingUp className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              Could not load statistics.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const tasksDone = stats.tasks.done ?? 0;
  const tasksTotal = stats.tasks.total;
  const taskProgress = tasksTotal > 0 ? (tasksDone / tasksTotal) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Task Distribution */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <ListTodo className="h-5 w-5" />
            Task Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">
                {tasksDone}/{tasksTotal} completed
              </span>
            </div>
            <Progress value={taskProgress} className="h-2" />
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.tasks.todo ?? 0}</p>
                <p className="text-xs text-muted-foreground">To Do</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {stats.tasks.in_progress ?? 0}
                </p>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{tasksDone}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Time Entries"
          value={stats.time.total_entries.toString()}
          description="Recorded time entries"
          icon={<Timer className="h-5 w-5 text-blue-500" />}
        />
        <StatCard
          title="Total Hours"
          value={`${stats.time.total_hours.toFixed(1)} hrs`}
          description="Total tracked duration"
          icon={<Clock className="h-5 w-5 text-emerald-500" />}
        />
        <StatCard
          title="Billable Hours"
          value={`${stats.time.billable_hours.toFixed(1)} hrs`}
          description="Billable duration"
          icon={<CheckCircle2 className="h-5 w-5 text-purple-500" />}
        />
        <StatCard
          title="Total Expenses"
          value={formatCurrency(stats.expenses.total_amount)}
          description={`${stats.expenses.total_count} expense ${stats.expenses.total_count === 1 ? "record" : "records"}`}
          icon={<Receipt className="h-5 w-5 text-amber-500" />}
        />
        <StatCard
          title="Total Billed"
          value={formatCurrency(stats.budget.total_billed)}
          description="Amount billed"
          icon={<Banknote className="h-5 w-5 text-emerald-500" />}
        />
        {stats.budget.budget != null && (
          <StatCard
            title="Budget Usage"
            value={
              stats.budget.budget_used_percent != null
                ? `${stats.budget.budget_used_percent.toFixed(0)}%`
                : "—"
            }
            description={`Budget: ${formatCurrency(stats.budget.budget)}`}
            icon={<DollarSign className="h-5 w-5 text-red-500" />}
            highlight={
              stats.budget.budget_used_percent != null &&
              stats.budget.budget_used_percent > 80
            }
          />
        )}
      </div>
    </div>
  );
}

// Stat card component
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
