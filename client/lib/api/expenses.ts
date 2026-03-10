import api from "./client";

export const EXPENSE_CATEGORIES = ["software", "domain", "hosting", "travel", "office", "hardware", "other"] as const;
export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];

export interface Expense {
  id: string;
  user_id: string;
  project_id: string | null;
  category: ExpenseCategory | null;
  description: string;
  amount: number;
  currency: string;
  date: string;
  receipt_url: string | null;
  tax_deductible: boolean;
  created_at: string;
  updated_at: string;
  project?: { id: string; name: string; color: string | null } | null;
}

export interface ExpensesResponse {
  success: boolean;
  expenses: Expense[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ExpenseStats {
  total_expenses: number;
  expense_count: number;
  tax_deductible_total: number;
  total_revenue: number;
  net_profit: number;
  by_category: { category: string; total: number; count: number }[];
}

export interface ExpensesQueryParams {
  page?: number;
  limit?: number;
  project_id?: string;
  category?: ExpenseCategory;
  tax_deductible?: boolean;
  start_date?: string;
  end_date?: string;
  sort?: "date" | "amount" | "created_at" | "category";
  order?: "asc" | "desc";
}

export interface CreateExpenseData {
  project_id?: string;
  category?: ExpenseCategory;
  description: string;
  amount: number;
  currency?: string;
  date: string;
  tax_deductible?: boolean;
}

export interface UpdateExpenseData extends Partial<CreateExpenseData> {}

export const expensesApi = {
  getExpenses: async (params?: ExpensesQueryParams): Promise<ExpensesResponse> => {
    const response = await api.get("/expenses", { params });
    return response.data;
  },

  getExpenseById: async (id: string): Promise<{ success: boolean; expense: Expense }> => {
    const response = await api.get(`/expenses/${id}`);
    return response.data;
  },

  createExpense: async (data: CreateExpenseData): Promise<{ success: boolean; message: string; expense: Expense }> => {
    const response = await api.post("/expenses", data);
    return response.data;
  },

  updateExpense: async (id: string, data: UpdateExpenseData): Promise<{ success: boolean; message: string; expense: Expense }> => {
    const response = await api.patch(`/expenses/${id}`, data);
    return response.data;
  },

  deleteExpense: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/expenses/${id}`);
    return response.data;
  },

  getStats: async (params?: { start_date?: string; end_date?: string }): Promise<{ success: boolean; stats: ExpenseStats }> => {
    const response = await api.get("/expenses/stats", { params });
    return response.data;
  },

  uploadReceipt: async (id: string, file: File): Promise<{ success: boolean; message: string; expense: Expense }> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post(`/expenses/${id}/receipt`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  deleteReceipt: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/expenses/${id}/receipt`);
    return response.data;
  },
};

export default expensesApi;
