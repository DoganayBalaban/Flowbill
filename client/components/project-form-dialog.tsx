"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
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
import { Textarea } from "@/components/ui/textarea";
import { Project } from "@/lib/api/projects";
import { useClients } from "@/lib/hooks/useClients";
import { useCreateProject, useUpdateProject } from "@/lib/hooks/useProjects";
import { createProjectSchema } from "@/lib/validations/projects";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

interface ProjectFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project | null;
}

type FormData = z.infer<typeof createProjectSchema>;

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "on_hold", label: "On Hold" },
  { value: "cancelled", label: "Cancelled" },
];

export function ProjectFormDialog({
  open,
  onOpenChange,
  project,
}: ProjectFormDialogProps) {
  const isEditing = !!project;
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const { data: clientsData } = useClients({ limit: 100 });

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: "",
      description: "",
      status: "active",
      client_id: "",
      budget: undefined,
      hourly_rate: undefined,
      start_date: "",
      deadline: "",
      color: "#6C5CE7",
    },
  });

  useEffect(() => {
    if (open && project) {
      reset({
        name: project.name,
        description: project.description || "",
        status: project.status,
        client_id: project.client_id || "",
        budget: project.budget ?? undefined,
        hourly_rate: project.hourly_rate ?? undefined,
        start_date: project.start_date
          ? new Date(project.start_date).toISOString().split("T")[0]
          : "",
        deadline: project.deadline
          ? new Date(project.deadline).toISOString().split("T")[0]
          : "",
        color: project.color || "#6C5CE7",
      });
    } else if (open) {
      reset({
        name: "",
        description: "",
        status: "active",
        client_id: "",
        budget: undefined,
        hourly_rate: undefined,
        start_date: "",
        deadline: "",
        color: "#6C5CE7",
      });
    }
  }, [open, project, reset]);

  const onSubmit = (data: FormData) => {
    // Clean empty strings, undefined, and NaN values
    const cleaned = Object.fromEntries(
      Object.entries(data).filter(
        ([, v]) =>
          v !== "" && v !== undefined && !(typeof v === "number" && isNaN(v))
      )
    );

    // Convert dates to ISO format
    if (cleaned.start_date) {
      cleaned.start_date = new Date(cleaned.start_date as string).toISOString();
    }
    if (cleaned.deadline) {
      cleaned.deadline = new Date(cleaned.deadline as string).toISOString();
    }

    if (isEditing && project) {
      updateProject.mutate(
        { id: project.id, data: cleaned },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      createProject.mutate(cleaned as { name: string }, {
        onSuccess: () => onOpenChange(false),
      });
    }
  };

  const isPending = createProject.isPending || updateProject.isPending;
  const clients = clientsData?.clients ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[580px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Project" : "New Project"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the project's information."
              : "Create a new project."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Project Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Project name"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Client */}
            <div className="space-y-2">
              <Label>Client</Label>
              <Controller
                name="client_id"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value || "none"}
                    onValueChange={(val) => field.onChange(val === "none" ? "" : val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Client</SelectItem>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                          {c.company ? ` — ${c.company}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Color */}
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="color"
                  type="color"
                  className="w-12 h-9 p-1 cursor-pointer"
                  {...register("color")}
                />
                <Input
                  placeholder="#6C5CE7"
                  className="flex-1"
                  {...register("color")}
                />
              </div>
              {errors.color && (
                <p className="text-sm text-destructive">
                  {errors.color.message}
                </p>
              )}
            </div>

            {/* Budget */}
            <div className="space-y-2">
              <Label htmlFor="budget">Budget ($)</Label>
              <Input
                id="budget"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register("budget", { valueAsNumber: true })}
              />
              {errors.budget && (
                <p className="text-sm text-destructive">
                  {errors.budget.message}
                </p>
              )}
            </div>

            {/* Hourly Rate */}
            <div className="space-y-2">
              <Label htmlFor="hourly_rate">Hourly Rate ($)</Label>
              <Input
                id="hourly_rate"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register("hourly_rate", { valueAsNumber: true })}
              />
              {errors.hourly_rate && (
                <p className="text-sm text-destructive">
                  {errors.hourly_rate.message}
                </p>
              )}
            </div>

            {/* Start Date */}
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                {...register("start_date")}
              />
            </div>

            {/* Deadline */}
            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline</Label>
              <Input
                id="deadline"
                type="date"
                {...register("deadline")}
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Description about this project..."
              rows={3}
              {...register("description")}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
