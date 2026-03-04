"use client";

import { CreateTaskData, tasksApi, UpdateTaskData } from "@/lib/api/tasks";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// Create task
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTaskData) => tasksApi.createTask(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["projects", variables.projectId, "tasks"],
      });
      queryClient.invalidateQueries({
        queryKey: ["projects", variables.projectId, "stats"],
      });
    },
  });
}

// Update task (used for drag-and-drop + inline edits)
export function useUpdateTask(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaskData }) =>
      tasksApi.updateTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["projects", projectId, "tasks"],
      });
      queryClient.invalidateQueries({
        queryKey: ["projects", projectId, "stats"],
      });
    },
  });
}

// Delete task
export function useDeleteTask(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => tasksApi.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["projects", projectId, "tasks"],
      });
      queryClient.invalidateQueries({
        queryKey: ["projects", projectId, "stats"],
      });
    },
  });
}
