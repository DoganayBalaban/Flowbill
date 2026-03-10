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
import { Expense } from "@/lib/api/expenses";
import { useCreateExpense, useUpdateExpense } from "@/lib/hooks/useExpenses";
import { useProjects } from "@/lib/hooks/useProjects";
import {
  CreateExpenseFormData,
  createExpenseSchema,
  EXPENSE_CATEGORIES,
} from "@/lib/validations/expenses";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

interface ExpenseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: Expense | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  software: "Software",
  domain: "Domain",
  hosting: "Hosting",
  travel: "Travel",
  office: "Office",
  hardware: "Hardware",
  other: "Other",
};

export function ExpenseFormDialog({
  open,
  onOpenChange,
  expense,
}: ExpenseFormDialogProps) {
  const isEditing = !!expense;
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const { data: projectsData } = useProjects({ limit: 100, sort: "name", order: "asc" });

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CreateExpenseFormData>({
    resolver: zodResolver(createExpenseSchema) as any,
    defaultValues: {
      description: "",
      amount: 0,
      currency: "USD",
      date: new Date().toISOString().split("T")[0],
      category: undefined,
      project_id: "",
      tax_deductible: true,
    },
  });

  useEffect(() => {
    if (open) {
      if (expense) {
        reset({
          description: expense.description,
          amount: Number(expense.amount),
          currency: expense.currency || "USD",
          date: expense.date?.split("T")[0] ?? new Date().toISOString().split("T")[0],
          category: expense.category ?? undefined,
          project_id: expense.project_id ?? "",
          tax_deductible: expense.tax_deductible,
        });
      } else {
        reset({
          description: "",
          amount: 0,
          currency: "USD",
          date: new Date().toISOString().split("T")[0],
          category: undefined,
          project_id: "",
          tax_deductible: true,
        });
      }
    }
  }, [open, expense, reset]);

  const onSubmit = (data: CreateExpenseFormData) => {
    const payload = {
      description: data.description,
      amount: data.amount,
      currency: data.currency,
      date: data.date,
      category: data.category || undefined,
      project_id: data.project_id || undefined,
      tax_deductible: data.tax_deductible,
    };

    if (isEditing && expense) {
      updateExpense.mutate(
        { id: expense.id, data: payload },
        {
          onSuccess: () => {
            toast.success("Expense updated successfully");
            onOpenChange(false);
          },
          onError: () => {
            toast.error("Failed to update expense");
          },
        },
      );
    } else {
      createExpense.mutate(payload, {
        onSuccess: () => {
          toast.success("Expense created successfully");
          onOpenChange(false);
        },
        onError: () => {
          toast.error("Failed to create expense");
        },
      });
    }
  };

  const isPending = createExpense.isPending || updateExpense.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Expense" : "New Expense"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the expense details."
              : "Record a new business expense."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Input
              id="description"
              placeholder="e.g. Monthly SaaS subscription"
              {...register("description")}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          {/* Amount + Currency */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...register("amount", { valueAsNumber: true })}
              />
              {errors.amount && (
                <p className="text-sm text-destructive">{errors.amount.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Controller
                control={control}
                name="currency"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="TRY">TRY</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <Input id="date" type="date" {...register("date")} />
            {errors.date && (
              <p className="text-sm text-destructive">{errors.date.message}</p>
            )}
          </div>

          {/* Category + Project */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <Select
                    value={field.value ?? ""}
                    onValueChange={(val) =>
                      field.onChange(val === "__none__" ? undefined : val)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">No category</SelectItem>
                      {EXPENSE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {CATEGORY_LABELS[cat]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label>Project</Label>
              <Controller
                control={control}
                name="project_id"
                render={({ field }) => (
                  <Select
                    value={field.value ?? ""}
                    onValueChange={(val) =>
                      field.onChange(val === "__none__" ? "" : val)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">No project</SelectItem>
                      {projectsData?.projects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          {/* Tax Deductible */}
          <div className="flex items-center gap-3">
            <Controller
              control={control}
              name="tax_deductible"
              render={({ field }) => (
                <input
                  id="tax_deductible"
                  type="checkbox"
                  className="h-4 w-4"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                />
              )}
            />
            <Label htmlFor="tax_deductible" className="cursor-pointer font-normal">
              Tax deductible
            </Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
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
