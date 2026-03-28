"use client";

import {
  ManualTimeEntryData,
  StartTimerData,
  TimeReportParams,
  UpdateTimeEntryData,
  timeEntriesApi,
} from "@/lib/api/timeEntries";
import { analytics } from "@/lib/analytics";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// ─── Queries ──────────────────────────────────────────────────────────────────

/** Currently running timer (null when no timer is active) */
export function useActiveTimer() {
  return useQuery({
    queryKey: ["time-entries", "active"],
    queryFn: () => timeEntriesApi.getActiveTimer(),
    select: (res) => res.data,
    // Poll every 10 seconds so the elapsed time stays fresh
    refetchInterval: 10_000,
  });
}

/** Single time entry with full relations (project, task, invoice) */
export function useTimeEntry(id: string) {
  return useQuery({
    queryKey: ["time-entries", id],
    queryFn: () => timeEntriesApi.getById(id),
    select: (res) => res.data,
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/** Aggregated time report — used on analytics / dashboard */
export function useTimeReport(params?: TimeReportParams) {
  return useQuery({
    queryKey: ["time-entries", "report", params],
    queryFn: () => timeEntriesApi.getReport(params),
    select: (res) => res.data,
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/** Start a live timer */
export function useStartTimer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: StartTimerData) => timeEntriesApi.startTimer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-entries"] });
      analytics.timerStarted();
    },
  });
}

/** Stop a running timer by id */
export function useStopTimer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => timeEntriesApi.stopTimer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-entries"] });
      analytics.timerStopped();
    },
  });
}

/** Create a manual time entry (start + end supplied upfront) */
export function useCreateManualTimeEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ManualTimeEntryData) =>
      timeEntriesApi.createManual(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-entries"] });
    },
  });
}

/** Update an existing time entry */
export function useUpdateTimeEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTimeEntryData }) =>
      timeEntriesApi.update(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["time-entries"] });
      queryClient.invalidateQueries({
        queryKey: ["time-entries", variables.id],
      });
    },
  });
}

/** Soft-delete a time entry */
export function useDeleteTimeEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => timeEntriesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-entries"] });
    },
  });
}
