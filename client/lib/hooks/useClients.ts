"use client";

import {
  clientsApi,
  ClientsQueryParams,
  CreateClientData,
  UpdateClientData,
} from "@/lib/api/clients";
import { analytics } from "@/lib/analytics";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// ─── List ──────────────────────────────────────────────────────────────────

export function useClients(params?: ClientsQueryParams) {
  return useQuery({
    queryKey: ["clients", params],
    queryFn: () => clientsApi.getClients(params),
    // Unwrap the nested data shape so callers get { clients, total, page, ... }
    select: (res) => res.data,
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Single ────────────────────────────────────────────────────────────────

export function useClient(id: string) {
  return useQuery({
    queryKey: ["clients", id],
    queryFn: () => clientsApi.getClient(id),
    select: (res) => res.data,
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Mutations ─────────────────────────────────────────────────────────────

export function useCreateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateClientData) => clientsApi.createClient(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      analytics.clientCreated();
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateClientData }) =>
      clientsApi.updateClient(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["clients", variables.id] });
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => clientsApi.deleteClient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}

// ─── Sub-resources ─────────────────────────────────────────────────────────

export function useClientProjects(id: string) {
  return useQuery({
    queryKey: ["clients", id, "projects"],
    queryFn: () => clientsApi.getClientProjects(id),
    select: (res) => res.data,
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useClientInvoices(id: string) {
  return useQuery({
    queryKey: ["clients", id, "invoices"],
    queryFn: () => clientsApi.getClientInvoices(id),
    select: (res) => res.data,
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useClientRevenue(id: string) {
  return useQuery({
    queryKey: ["clients", id, "revenue"],
    queryFn: () => clientsApi.getClientRevenue(id),
    select: (res) => res.data,
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useClientStats(id: string) {
  return useQuery({
    queryKey: ["clients", id, "stats"],
    queryFn: () => clientsApi.getClientStats(id),
    select: (res) => res.data,
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useClientTimeEntries(
  id: string,
  params?: { page?: number; limit?: number },
) {
  return useQuery({
    queryKey: ["clients", id, "time-entries", params],
    queryFn: () => clientsApi.getClientTimeEntries(id, params),
    select: (res) => res.data,
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}
