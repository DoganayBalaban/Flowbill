"use client";

import {
    CreateProjectData,
    projectsApi,
    ProjectsQueryParams,
    UpdateProjectData,
} from "@/lib/api/projects";
import { analytics } from "@/lib/analytics";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// List projects with pagination/search/sort/filter
export function useProjects(params?: ProjectsQueryParams) {
  return useQuery({
    queryKey: ["projects", params],
    queryFn: () => projectsApi.getProjects(params),
    staleTime: 5 * 60 * 1000,
  });
}

// Single project
export function useProject(id: string) {
  return useQuery({
    queryKey: ["projects", id],
    queryFn: () => projectsApi.getProject(id),
    select: (data) => data.project,
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// Create project
export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProjectData) => projectsApi.createProject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      analytics.projectCreated();
    },
  });
}

// Update project
export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProjectData }) =>
      projectsApi.updateProject(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["projects", variables.id] });
    },
  });
}

// Delete project
export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => projectsApi.deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

// Project tasks
export function useProjectTasks(id: string) {
  return useQuery({
    queryKey: ["projects", id, "tasks"],
    queryFn: () => projectsApi.getProjectTasks(id),
    select: (data) => data.tasks,
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// Project time entries
export function useProjectTimeEntries(id: string) {
  return useQuery({
    queryKey: ["projects", id, "time-entries"],
    queryFn: () => projectsApi.getProjectTimeEntries(id),
    select: (data) => data.timeEntries,
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// Project stats
export function useProjectStats(id: string) {
  return useQuery({
    queryKey: ["projects", id, "stats"],
    queryFn: () => projectsApi.getProjectStats(id),
    select: (data) => data.stats,
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// List attachments
export function useProjectAttachments(id: string) {
  return useQuery({
    queryKey: ["projects", id, "attachments"],
    queryFn: () => projectsApi.getProjectAttachments(id),
    select: (data) => data.attachments,
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// Add attachment
export function useAddProjectAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      projectsApi.addAttachment(id, file),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["projects", variables.id, "attachments"] });
    },
  });
}

// Delete attachment
export function useDeleteProjectAttachment(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (attachmentId: string) =>
      projectsApi.deleteAttachment(projectId, attachmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", projectId, "attachments"] });
    },
  });
}
