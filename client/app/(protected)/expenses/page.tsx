"use client";

import { ExpenseFormDialog } from "@/components/expense-form-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { useTranslation } from "@/lib/i18n/context";
import { Expense, ExpenseCategory, ExpensesQueryParams } from "@/lib/api/expenses";
import {
  useDeleteExpense,
  useDeleteReceipt,
  useExpenses,
  useExpenseStats,
  useUploadReceipt,
} from "@/lib/hooks/useExpenses";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  Pencil,
  Plus,
  Receipt,
  Trash2,
  TrendingDown,
  TrendingUp,
  Upload,
  Wallet,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

// ── Helpers ────────────────────────────────────────────────────────────────

function formatCurrency(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
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

const CATEGORY_KEYS = ["software", "domain", "hosting", "travel", "office", "hardware", "other"] as const;

const CATEGORY_COLORS: Record<string, string> = {
  software: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  domain: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  hosting: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
  travel: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  office: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  hardware: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300",
  other: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300",
};

// ── Receipt Upload Cell ─────────────────────────────────────────────────────

function ReceiptCell({ expense }: { expense: Expense }) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadReceipt = useUploadReceipt();
  const deleteReceipt = useDeleteReceipt();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadReceipt.mutate(
      { id: expense.id, file },
      {
        onSuccess: () => toast.success(t("expenses.receipt_uploaded")),
        onError: () => toast.error(t("expenses.receipt_upload_error")),
      },
    );
    // Reset input so same file can be re-uploaded if needed
    e.target.value = "";
  };

  if (expense.receipt_url) {
    return (
      <div className="flex items-center gap-1">
        <a
          href={expense.receipt_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink className="h-3 w-3" />
          {t("expenses.view_receipt")}
        </a>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            deleteReceipt.mutate(expense.id, {
              onSuccess: () => toast.success(t("expenses.receipt_removed")),
              onError: () => toast.error(t("expenses.receipt_remove_error")),
            });
          }}
          disabled={deleteReceipt.isPending}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        onChange={handleFileChange}
      />
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-xs text-muted-foreground"
        onClick={(e) => {
          e.stopPropagation();
          fileInputRef.current?.click();
        }}
        disabled={uploadReceipt.isPending}
      >
        {uploadReceipt.isPending ? (
          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
        ) : (
          <Upload className="mr-1 h-3 w-3" />
        )}
        {t("expenses.upload_receipt")}
      </Button>
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function ExpensesPage() {
  const { t } = useTranslation();
  const [params, setParams] = useState<ExpensesQueryParams>({
    page: 1,
    limit: 20,
    sort: "date",
    order: "desc",
  });
  const [statsDateFilter, setStatsDateFilter] = useState<{
    start_date?: string;
    end_date?: string;
  }>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading, error } = useExpenses(params);
  const { data: stats } = useExpenseStats(statsDateFilter);
  const deleteExpense = useDeleteExpense();

  const handleDelete = () => {
    if (!deleteId) return;
    deleteExpense.mutate(deleteId, {
      onSuccess: () => {
        toast.success(t("expenses.expense_deleted"));
        setDeleteId(null);
      },
      onError: () => {
        toast.error(t("expenses.expense_delete_error"));
        setDeleteId(null);
      },
    });
  };

  const handleCategoryFilter = (val: string) => {
    setParams((prev) => ({
      ...prev,
      page: 1,
      category: val === "all" ? undefined : (val as ExpenseCategory),
    }));
  };

  const handleTaxFilter = (val: string) => {
    setParams((prev) => ({
      ...prev,
      page: 1,
      tax_deductible:
        val === "all" ? undefined : val === "true" ? true : false,
    }));
  };

  const handlePageChange = (newPage: number) => {
    setParams((prev) => ({ ...prev, page: newPage }));
  };

  const handleOpenCreate = () => {
    setEditingExpense(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{t("expenses.title")}</h1>
              <p className="text-sm text-muted-foreground">
                {t("expenses.subtitle")}
              </p>
            </div>
          </div>
          <Button onClick={handleOpenCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {t("expenses.new_expense")}
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                      {t("expenses.stat_total")}
                    </p>
                    <p className="text-2xl font-bold mt-1 text-foreground">
                      {formatCurrency(stats.total_expenses)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {stats.expense_count === 1
                        ? t("expenses.expenses_found_one", { count: String(stats.expense_count) })
                        : t("expenses.expenses_found_other", { count: String(stats.expense_count) })}
                    </p>
                  </div>
                  <Wallet className="h-8 w-8 text-muted-foreground/40" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                      {t("expenses.stat_tax_deductible")}
                    </p>
                    <p className="text-2xl font-bold mt-1 text-blue-600 dark:text-blue-400">
                      {formatCurrency(stats.tax_deductible_total)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t("expenses.stat_of_total")}
                    </p>
                  </div>
                  <Receipt className="h-8 w-8 text-blue-500/30" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                      {t("expenses.stat_net_profit")}
                    </p>
                    <p
                      className={`text-2xl font-bold mt-1 ${
                        stats.net_profit >= 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {formatCurrency(stats.net_profit)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t("expenses.stat_revenue", { amount: formatCurrency(stats.total_revenue) })}
                    </p>
                  </div>
                  {stats.net_profit >= 0 ? (
                    <TrendingUp className="h-8 w-8 text-green-500/30" />
                  ) : (
                    <TrendingDown className="h-8 w-8 text-red-500/30" />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-3">
              {/* Date range for stats */}
              <Input
                type="date"
                className="w-44"
                placeholder="Start date"
                onChange={(e) => {
                  const val = e.target.value || undefined;
                  setStatsDateFilter((prev) => ({ ...prev, start_date: val }));
                  setParams((prev) => ({ ...prev, page: 1, start_date: val }));
                }}
              />
              <Input
                type="date"
                className="w-44"
                placeholder="End date"
                onChange={(e) => {
                  const val = e.target.value || undefined;
                  setStatsDateFilter((prev) => ({ ...prev, end_date: val }));
                  setParams((prev) => ({ ...prev, page: 1, end_date: val }));
                }}
              />
              <Select
                value={params.category ?? "all"}
                onValueChange={handleCategoryFilter}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder={t("expenses.all_categories")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("expenses.all_categories")}</SelectItem>
                  {CATEGORY_KEYS.map((key) => (
                    <SelectItem key={key} value={key}>
                      {t(`expenses.cat_${key}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={
                  params.tax_deductible === undefined
                    ? "all"
                    : String(params.tax_deductible)
                }
                onValueChange={handleTaxFilter}
              >
                <SelectTrigger className="w-[170px]">
                  <SelectValue placeholder={t("expenses.tax_deductible")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("expenses.all")}</SelectItem>
                  <SelectItem value="true">{t("expenses.tax_deductible")}</SelectItem>
                  <SelectItem value="false">{t("expenses.non_deductible")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>{t("expenses.expense_list")}</CardTitle>
            <CardDescription>
              {data
                ? data.total === 1
                  ? t("expenses.expenses_found_one", { count: String(data.total) })
                  : t("expenses.expenses_found_other", { count: String(data.total) })
                : t("common.loading")}
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
                {t("expenses.failed_to_load")}
              </div>
            ) : data?.expenses.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <Receipt className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <div>
                  <p className="font-medium text-muted-foreground">
                    {t("expenses.no_expenses")}
                  </p>
                  <p className="text-sm text-muted-foreground/70">
                    {t("expenses.no_expenses_desc")}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={handleOpenCreate}
                  className="mt-2"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t("expenses.add_expense")}
                </Button>
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("expenses.col_date")}</TableHead>
                        <TableHead>{t("expenses.col_description")}</TableHead>
                        <TableHead className="hidden md:table-cell">
                          {t("expenses.col_category")}
                        </TableHead>
                        <TableHead className="hidden lg:table-cell">
                          {t("expenses.col_project")}
                        </TableHead>
                        <TableHead>{t("expenses.col_amount")}</TableHead>
                        <TableHead className="hidden sm:table-cell">
                          {t("expenses.col_tax")}
                        </TableHead>
                        <TableHead className="hidden md:table-cell">
                          {t("expenses.col_receipt")}
                        </TableHead>
                        <TableHead className="w-[80px]">{t("expenses.col_actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data?.expenses.map((expense) => (
                        <TableRow key={expense.id}>
                          <TableCell className="text-sm whitespace-nowrap">
                            {formatDate(expense.date)}
                          </TableCell>
                          <TableCell className="max-w-[200px]">
                            <span className="truncate block text-sm font-medium">
                              {expense.description}
                            </span>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {expense.category ? (
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_COLORS[expense.category] ?? CATEGORY_COLORS.other}`}
                              >
                                {t(`expenses.cat_${expense.category}`)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                            {expense.project?.name ?? "—"}
                          </TableCell>
                          <TableCell className="font-medium text-sm whitespace-nowrap">
                            {formatCurrency(expense.amount, expense.currency)}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <Badge
                              variant={expense.tax_deductible ? "secondary" : "outline"}
                              className="text-xs"
                            >
                              {expense.tax_deductible ? t("expenses.yes") : t("expenses.no")}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <ReceiptCell expense={expense} />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleOpenEdit(expense)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => setDeleteId(expense.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
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
                      {t("common.page_of", { page: String(data.page), total: String(data.totalPages) })}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={data.page <= 1}
                        onClick={() => handlePageChange(data.page - 1)}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        {t("common.previous")}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={data.page >= data.totalPages}
                        onClick={() => handlePageChange(data.page + 1)}
                      >
                        {t("common.next")}
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
      <ExpenseFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingExpense(null);
        }}
        expense={editingExpense}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("expenses.delete_title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("expenses.delete_desc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              {deleteExpense.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete overlay */}
      {deleteExpense.isPending && (
        <div className="fixed inset-0 bg-background/50 flex items-center justify-center z-50">
          <div className="flex items-center gap-3 bg-card p-4 rounded-lg shadow-lg border">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>{t("common.deleting")}</span>
          </div>
        </div>
      )}
    </div>
  );
}
