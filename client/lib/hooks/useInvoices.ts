"use client";

import {
  CreateInvoiceData,
  invoicesApi,
  InvoicesQueryParams,
  MarkAsPaidData,
  UpdateInvoiceData,
} from "@/lib/api/invoices";
import { analytics } from "@/lib/analytics";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// ── List invoices ──────────────────────────────────────────────────────────

export function useInvoices(params?: InvoicesQueryParams) {
  return useQuery({
    queryKey: ["invoices", params],
    queryFn: () => invoicesApi.getInvoices(params),
    staleTime: 5 * 60 * 1000,
  });
}

// ── Single invoice ─────────────────────────────────────────────────────────

export function useInvoice(id: string) {
  return useQuery({
    queryKey: ["invoices", id],
    queryFn: () => invoicesApi.getInvoice(id),
    select: (data) => data.data,
    enabled: !!id,
    refetchOnMount: "always",
  });
}

// ── Invoice stats ──────────────────────────────────────────────────────────

export function useInvoiceStats(start?: string, end?: string) {
  return useQuery({
    queryKey: ["invoices", "stats", start, end],
    queryFn: () => invoicesApi.getInvoiceStats(start, end),
    select: (data) => data.data,
    staleTime: 5 * 60 * 1000,
  });
}

// ── Create invoice ─────────────────────────────────────────────────────────

export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateInvoiceData) => invoicesApi.createInvoice(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      analytics.invoiceCreated(variables.currency ?? "USD");
    },
  });
}

// ── Update invoice ─────────────────────────────────────────────────────────

export function useUpdateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInvoiceData }) =>
      invoicesApi.updateInvoice(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoices", variables.id] });
    },
  });
}

// ── Delete invoice ─────────────────────────────────────────────────────────

export function useDeleteInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => invoicesApi.deleteInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}

// ── Generate PDF ───────────────────────────────────────────────────────────

export function useGeneratePdf() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, force }: { id: string; force?: boolean }) =>
      invoicesApi.generatePdf(id, force),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["invoices", variables.id] });
    },
  });
}

// ── Download PDF ───────────────────────────────────────────────────────────

export function useDownloadPdf() {
  return useMutation({
    mutationFn: (id: string) => invoicesApi.downloadPdf(id),
    onSuccess: (data) => {
      // Open the pre-signed URL in a new tab
      window.open(data.download_url, "_blank");
    },
  });
}

// ── Send email ─────────────────────────────────────────────────────────────

export function useSendInvoiceEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => invoicesApi.sendEmail(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoices", id] });
      analytics.invoiceEmailSent();
    },
  });
}

// ── Mark as paid ───────────────────────────────────────────────────────────

export function useMarkAsPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: MarkAsPaidData }) =>
      invoicesApi.markAsPaid(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoices", variables.id] });
    },
  });
}

// ── Create Stripe payment link ──────────────────────────────────────────────

export function useCreatePaymentLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => invoicesApi.createPaymentLink(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["invoices", id] });
    },
  });
}
