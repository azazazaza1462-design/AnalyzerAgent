import { useQuery } from "@tanstack/react-query";
import {
  fetchDecision,
  fetchDocuments,
  fetchJobQueueSummary,
  fetchJobRun,
  fetchJobs,
  type DocumentsListParams,
  type JobsListParams,
} from "../api";

export function useJobDecision(id: string | undefined) {
  return useQuery({
    queryKey: ["workspace", "decision", id],
    queryFn: () => fetchDecision(id!),
    enabled: !!id,
  });
}

export function useJobRun(id: string | undefined) {
  return useQuery({
    queryKey: ["workspace", "job", id],
    queryFn: () => fetchJobRun(id!),
    enabled: !!id,
    // While a run is in flight the agent is still writing — refetch so the
    // timeline and result fill in without a manual reload.
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "completed" || status === "failed" || status === "cancelled"
        ? false
        : 4000;
    },
  });
}

export function useJobQueueSummary() {
  return useQuery({
    queryKey: ["workspace", "summary"],
    queryFn: fetchJobQueueSummary,
    staleTime: 30_000,
  });
}

export function useJobs(params: JobsListParams) {
  return useQuery({
    queryKey: ["workspace", "jobs", params],
    queryFn: () => fetchJobs(params),
    staleTime: 30_000,
  });
}

export function useDocuments(params: DocumentsListParams) {
  return useQuery({
    queryKey: ["workspace", "documents", params],
    queryFn: () => fetchDocuments(params),
    staleTime: 30_000,
  });
}
