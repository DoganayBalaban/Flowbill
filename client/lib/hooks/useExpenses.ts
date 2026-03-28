"use client";

import {
  CreateExpenseData,
  expensesApi,
  ExpensesQueryParams,
  UpdateExpenseData,
} from "@/lib/api/expenses";
import { analytics } from "@/lib/analytics";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useExpenses(params?: ExpensesQueryParams) {
  return useQuery({
    queryKey: ["expenses", params],
    queryFn: () => expensesApi.getExpenses(params),
    staleTime: 5 * 60 * 1000,
  });
}

export function useExpenseStats(params?: { start_date?: string; end_date?: string }) {
  return useQuery({
    queryKey: ["expenses", "stats", params],
    queryFn: () => expensesApi.getStats(params),
    select: (data) => data.stats,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateExpenseData) => expensesApi.createExpense(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      analytics.expenseCreated();
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateExpenseData }) =>
      expensesApi.updateExpense(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => expensesApi.deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
  });
}

export function useUploadReceipt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      expensesApi.uploadReceipt(id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
  });
}

export function useDeleteReceipt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => expensesApi.deleteReceipt(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
  });
}
