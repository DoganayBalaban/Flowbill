import api from "./client";

// Types
export interface CreateTaskData {
  projectId: string;
  title: string;
  description?: string;
  status?: "todo" | "in_progress" | "done";
  priority?: "low" | "medium" | "high";
  due_date?: string;
  estimated_hours?: number;
  position?: number;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  status?: "todo" | "in_progress" | "done";
  priority?: "low" | "medium" | "high";
  due_date?: string;
  estimated_hours?: number;
  position?: number;
}

// API Functions
export const tasksApi = {
  createTask: async (data: CreateTaskData) => {
    const response = await api.post("/tasks", data);
    return response.data;
  },

  updateTask: async (id: string, data: UpdateTaskData) => {
    const response = await api.patch(`/tasks/${id}`, data);
    return response.data;
  },

  deleteTask: async (id: string) => {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  },
};

export default tasksApi;
