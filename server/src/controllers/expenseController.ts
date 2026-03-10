import { Response } from "express";
import { env } from "../config/env";
import { AuthRequest } from "../middlewares/authMiddleware";
import { ExpenseService } from "../services/expenseService";
import { catchAsync } from "../utils/catchAsync";
import { deleteFromS3 } from "../utils/storageUpload";
import {
  createExpenseSchema,
  expenseStatsQuerySchema,
  getExpensesQuerySchema,
  updateExpenseSchema,
} from "../validators/expenseSchema";

export const getExpenses = catchAsync(async (req: AuthRequest, res: Response) => {
  const query = getExpensesQuerySchema.parse(req.query);
  const result = await ExpenseService.getExpenses(req.user!.id, query);
  res.status(200).json({ success: true, ...result });
});

export const getExpenseById = catchAsync(async (req: AuthRequest, res: Response) => {
  const expense = await ExpenseService.getExpenseById(req.user!.id, req.params.id as string);
  res.status(200).json({ success: true, expense });
});

export const createExpense = catchAsync(async (req: AuthRequest, res: Response) => {
  const data = createExpenseSchema.parse(req.body);
  const expense = await ExpenseService.createExpense(req.user!.id, data);
  res.status(201).json({ success: true, message: "Expense created successfully", expense });
});

export const updateExpense = catchAsync(async (req: AuthRequest, res: Response) => {
  const data = updateExpenseSchema.parse(req.body);
  const expense = await ExpenseService.updateExpense(req.user!.id, req.params.id as string, data);
  res.status(200).json({ success: true, message: "Expense updated successfully", expense });
});

export const deleteExpense = catchAsync(async (req: AuthRequest, res: Response) => {
  await ExpenseService.deleteExpense(req.user!.id, req.params.id as string);
  res.status(200).json({ success: true, message: "Expense deleted successfully" });
});

export const uploadReceipt = catchAsync(async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No file uploaded" });
  }

  const s3Url: string = (req.file as any).location ?? req.file.path;
  const s3Key: string = (req.file as any).key ?? "";

  let receipt_url = s3Url;
  if (env.CLOUDFRONT_URL && s3Key) {
    receipt_url = `${env.CLOUDFRONT_URL.replace(/\/$/, "")}/${s3Key}`;
  }

  const expense = await ExpenseService.updateReceiptUrl(req.user!.id, req.params.id as string, receipt_url);
  res.status(200).json({ success: true, message: "Receipt uploaded successfully", expense });
});

export const deleteReceipt = catchAsync(async (req: AuthRequest, res: Response) => {
  const expense = await ExpenseService.getExpenseById(req.user!.id, req.params.id as string);

  if (expense.receipt_url) {
    try {
      const cdnBase = env.CLOUDFRONT_URL?.replace(/\/$/, "");
      const s3Base = `https://${env.AWS_BUCKET_NAME}.s3.${env.AWS_REGION}.amazonaws.com`;
      let s3Key = "";
      if (cdnBase && expense.receipt_url.startsWith(cdnBase)) {
        s3Key = expense.receipt_url.slice(cdnBase.length + 1);
      } else if (expense.receipt_url.startsWith(s3Base)) {
        s3Key = expense.receipt_url.slice(s3Base.length + 1);
      }
      if (s3Key) await deleteFromS3(s3Key);
    } catch {
      // non-fatal
    }
  }

  await ExpenseService.updateReceiptUrl(req.user!.id, req.params.id as string, "");
  res.status(200).json({ success: true, message: "Receipt deleted successfully" });
});

export const getExpenseStats = catchAsync(async (req: AuthRequest, res: Response) => {
  const { start_date, end_date } = expenseStatsQuerySchema.parse(req.query);
  const stats = await ExpenseService.getStats(req.user!.id, start_date, end_date);
  res.status(200).json({ success: true, stats });
});
