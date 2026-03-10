"use client";

import { ProjectFormDialog } from "@/components/project-form-dialog";
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
import { Input } from "@/components/ui/input";
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
import { Project, ProjectsQueryParams } from "@/lib/api/projects";
import { useDeleteProject, useProjects } from "@/lib/hooks/useProjects";
import {
    ArrowUpDown,
    ChevronLeft,
    ChevronRight,
    FolderOpen,
    Loader2,
    MoreHorizontal,
    Pencil,
    Plus,
    Search,
    Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

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
  const map: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    active: "default",
    completed: "secondary",
    on_hold: "outline",
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

export default function ProjectsPage() {
  const router = useRouter();
  const [params, setParams] = useState<ProjectsQueryParams>({
    page: 1,
    limit: 10,
    sort: "created_at",
    order: "desc",
  });
  const [searchInput, setSearchInput] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const { data, isLoading, error } = useProjects(params);
  const deleteProject = useDeleteProject();

  const handleSearch = useCallback(() => {
    setParams((prev) => ({
      ...prev,
      page: 1,
      search: searchInput || undefined,
    }));
  }, [searchInput]);

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleSort = (field: ProjectsQueryParams["sort"]) => {
    setParams((prev) => ({
      ...prev,
      sort: field,
      order: prev.sort === field && prev.order === "asc" ? "desc" : "asc",
    }));
  };

  const handleStatusFilter = (value: string) => {
    setParams((prev) => ({
      ...prev,
      page: 1,
      status: value === "all" ? undefined : (value as ProjectsQueryParams["status"]),
    }));
  };

  const handlePageChange = (newPage: number) => {
    setParams((prev) => ({ ...prev, page: newPage }));
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this project?")) {
      deleteProject.mutate(id);
    }
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) setEditingProject(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <FolderOpen className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
              <p className="text-sm text-muted-foreground">
                Manage your projects
              </p>
            </div>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by project name..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  className="pl-10"
                />
              </div>
              <Button variant="secondary" onClick={handleSearch}>
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
              <Select
                value={params.status || "all"}
                onValueChange={handleStatusFilter}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={params.sort}
                onValueChange={(val) =>
                  setParams((prev) => ({
                    ...prev,
                    sort: val as ProjectsQueryParams["sort"],
                  }))
                }
              >
                <SelectTrigger className="w-[180px]">
                  <ArrowUpDown className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Date Created</SelectItem>
                  <SelectItem value="name">Project Name</SelectItem>
                  <SelectItem value="deadline">Deadline</SelectItem>
                  <SelectItem value="budget">Budget</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Project List</CardTitle>
            <CardDescription>
              {data
                ? `${data.total} ${data.total === 1 ? "project" : "projects"} found`
                : "Loading..."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-10 text-destructive">
                Failed to load projects.
              </div>
            ) : data?.projects.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <div>
                  <p className="font-medium text-muted-foreground">
                    No projects yet
                  </p>
                  <p className="text-sm text-muted-foreground/70">
                    Add your first project to get started.
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(true)}
                  className="mt-2"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Project
                </Button>
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead
                          className="cursor-pointer hover:text-foreground transition-colors"
                          onClick={() => handleSort("name")}
                        >
                          <span className="flex items-center gap-1">
                            Project Name
                            <ArrowUpDown className="h-3 w-3" />
                          </span>
                        </TableHead>
                        <TableHead className="hidden md:table-cell">
                          Client
                        </TableHead>
                        <TableHead
                          className="cursor-pointer hover:text-foreground transition-colors"
                          onClick={() => handleSort("status")}
                        >
                          <span className="flex items-center gap-1">
                            Status
                            <ArrowUpDown className="h-3 w-3" />
                          </span>
                        </TableHead>
                        <TableHead
                          className="hidden lg:table-cell cursor-pointer hover:text-foreground transition-colors"
                          onClick={() => handleSort("budget")}
                        >
                          <span className="flex items-center gap-1">
                            Budget
                            <ArrowUpDown className="h-3 w-3" />
                          </span>
                        </TableHead>
                        <TableHead
                          className="hidden lg:table-cell cursor-pointer hover:text-foreground transition-colors"
                          onClick={() => handleSort("deadline")}
                        >
                          <span className="flex items-center gap-1">
                            Deadline
                            <ArrowUpDown className="h-3 w-3" />
                          </span>
                        </TableHead>
                        <TableHead className="w-[50px]" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data?.projects.map((project) => (
                        <TableRow
                          key={project.id}
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() =>
                            router.push(`/projects/${project.id}`)
                          }
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {project.color && (
                                <div
                                  className="w-3 h-3 rounded-full shrink-0"
                                  style={{ backgroundColor: project.color }}
                                />
                              )}
                              <span className="font-medium">
                                {project.name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {project.client ? (
                              <Badge variant="secondary">
                                {project.client.name}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                —
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusVariant(project.status)}>
                              {getStatusLabel(project.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {formatCurrency(project.budget)}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {formatDate(project.deadline)}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                asChild
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEdit(project);
                                  }}
                                >
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(project.id);
                                  }}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {data && data.totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4">
                    <p className="text-sm text-muted-foreground">
                      Page {data.page} of {data.totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={data.page <= 1}
                        onClick={() => handlePageChange(data.page - 1)}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={data.page >= data.totalPages}
                        onClick={() => handlePageChange(data.page + 1)}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Form Dialog */}
      <ProjectFormDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        project={editingProject}
      />

      {/* Delete loading indicator */}
      {deleteProject.isPending && (
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
