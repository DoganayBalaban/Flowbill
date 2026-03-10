import { Prisma } from "@prisma/client";
import { AppError } from "../utils/appError";
import { prisma } from "../utils/prisma";
import {
  CreateExpenseInput,
  GetExpensesQueryInput,
  UpdateExpenseInput,
} from "../validators/expenseSchema";

export class ExpenseService {
  static async getExpenses(userId: string, query: GetExpensesQueryInput) {
    const { page, limit, project_id, category, tax_deductible, start_date, end_date, sort, order } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ExpenseWhereInput = {
      user_id: userId,
      deleted_at: null,
      ...(project_id && { project_id }),
      ...(category && { category }),
      ...(tax_deductible !== undefined && { tax_deductible }),
      ...((start_date || end_date) && {
        date: {
          ...(start_date && { gte: new Date(start_date) }),
          ...(end_date && { lte: new Date(end_date) }),
        },
      }),
    };

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        orderBy: { [sort]: order },
        skip,
        take: limit,
        include: {
          project: { select: { id: true, name: true, color: true } },
        },
      }),
      prisma.expense.count({ where }),
    ]);

    return { expenses, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async getExpenseById(userId: string, expenseId: string) {
    const expense = await prisma.expense.findFirst({
      where: { id: expenseId, user_id: userId, deleted_at: null },
      include: {
        project: { select: { id: true, name: true, color: true } },
      },
    });
    if (!expense) throw new AppError("Expense not found", 404);
    return expense;
  }

  static async createExpense(userId: string, data: CreateExpenseInput) {
    return prisma.expense.create({
      data: {
        user_id: userId,
        project_id: data.project_id,
        category: data.category,
        description: data.description,
        amount: data.amount,
        currency: data.currency,
        date: new Date(data.date),
        tax_deductible: data.tax_deductible,
      },
      include: {
        project: { select: { id: true, name: true, color: true } },
      },
    });
  }

  static async updateExpense(userId: string, expenseId: string, data: UpdateExpenseInput) {
    const existing = await prisma.expense.findFirst({
      where: { id: expenseId, user_id: userId, deleted_at: null },
    });
    if (!existing) throw new AppError("Expense not found", 404);

    return prisma.expense.update({
      where: { id: expenseId },
      data: {
        ...(data.project_id !== undefined && { project_id: data.project_id }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.amount !== undefined && { amount: data.amount }),
        ...(data.currency !== undefined && { currency: data.currency }),
        ...(data.date !== undefined && { date: new Date(data.date) }),
        ...(data.tax_deductible !== undefined && { tax_deductible: data.tax_deductible }),
      },
      include: {
        project: { select: { id: true, name: true, color: true } },
      },
    });
  }

  static async deleteExpense(userId: string, expenseId: string) {
    const existing = await prisma.expense.findFirst({
      where: { id: expenseId, user_id: userId, deleted_at: null },
    });
    if (!existing) throw new AppError("Expense not found", 404);

    return prisma.expense.update({
      where: { id: expenseId },
      data: { deleted_at: new Date() },
    });
  }

  static async updateReceiptUrl(userId: string, expenseId: string, receipt_url: string) {
    const existing = await prisma.expense.findFirst({
      where: { id: expenseId, user_id: userId, deleted_at: null },
    });
    if (!existing) throw new AppError("Expense not found", 404);

    return prisma.expense.update({
      where: { id: expenseId },
      data: { receipt_url: receipt_url || null },
    });
  }

  static async getStats(userId: string, start_date?: string, end_date?: string) {
    const dateFilter: Prisma.DateTimeFilter = {
      ...(start_date && { gte: new Date(start_date) }),
      ...(end_date && { lte: new Date(end_date) }),
    };

    const where: Prisma.ExpenseWhereInput = {
      user_id: userId,
      deleted_at: null,
      ...(Object.keys(dateFilter).length > 0 && { date: dateFilter }),
    };

    const [expenseAgg, taxDeductibleAgg, byCategory, paidInvoices] = await Promise.all([
      prisma.expense.aggregate({ where, _sum: { amount: true }, _count: { id: true } }),
      prisma.expense.aggregate({ where: { ...where, tax_deductible: true }, _sum: { amount: true } }),
      prisma.expense.groupBy({
        by: ["category"],
        where,
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.invoice.aggregate({
        where: {
          user_id: userId,
          status: "paid",
          deleted_at: null,
          ...(Object.keys(dateFilter).length > 0 && { paid_at: dateFilter }),
        },
        _sum: { total: true },
      }),
    ]);

    const totalExpenses = expenseAgg._sum.amount?.toNumber() ?? 0;
    const taxDeductibleTotal = taxDeductibleAgg._sum.amount?.toNumber() ?? 0;
    const totalRevenue = paidInvoices._sum.total?.toNumber() ?? 0;
    const netProfit = totalRevenue - totalExpenses;

    const categoryBreakdown = byCategory.map((g) => ({
      category: g.category ?? "other",
      total: g._sum.amount?.toNumber() ?? 0,
      count: g._count.id,
    }));

    return {
      total_expenses: totalExpenses,
      expense_count: expenseAgg._count.id,
      tax_deductible_total: taxDeductibleTotal,
      total_revenue: totalRevenue,
      net_profit: netProfit,
      by_category: categoryBreakdown,
    };
  }
}
