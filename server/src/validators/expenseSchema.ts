import { z } from "zod";

export const EXPENSE_CATEGORIES = ["software", "domain", "hosting", "travel", "office", "hardware", "other"] as const;

export const createExpenseSchema = z.object({
  project_id: z.string().uuid().optional(),
  category: z.enum(EXPENSE_CATEGORIES).optional(),
  description: z.string().min(1, "Description is required").max(500),
  amount: z.number().positive("Amount must be positive"),
  currency: z.string().length(3).default("USD"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  tax_deductible: z.boolean().default(true),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export const getExpensesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  project_id: z.string().uuid().optional(),
  category: z.enum(EXPENSE_CATEGORIES).optional(),
  tax_deductible: z.string().optional().transform(v => v === undefined ? undefined : v === "true"),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  sort: z.enum(["date", "amount", "created_at", "category"]).default("date"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export const expenseStatsQuerySchema = z.object({
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type GetExpensesQueryInput = z.infer<typeof getExpensesQuerySchema>;
export type ExpenseStatsQueryInput = z.infer<typeof expenseStatsQuerySchema>;
