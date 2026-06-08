import { useQuery } from "@tanstack/react-query";
import {
  fetchDocuments,
  fetchJobQueueSummary,
  fetchJobs,
  type DocumentsListParams,
  type JobsListParams,
} from "../api";

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
