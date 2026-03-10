import { z } from "zod";

export const EXPENSE_CATEGORIES = ["software", "domain", "hosting", "travel", "office", "hardware", "other"] as const;

export const createExpenseSchema = z.object({
  description: z.string().min(1, "Description is required").max(500),
  amount: z.coerce.number().positive("Amount must be positive"),
  currency: z.string().length(3).default("USD"),
  date: z.string().min(1, "Date is required"),
  category: z.enum(EXPENSE_CATEGORIES).optional(),
  project_id: z.string().uuid().optional().or(z.literal("")),
  tax_deductible: z.boolean().default(true),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export type CreateExpenseFormData = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseFormData = z.infer<typeof updateExpenseSchema>;
