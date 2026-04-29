import { useQuery } from "@tanstack/react-query";
import { queryKeys, type JobsListParams } from "@/lib/query-keys";
import { fetchJobs } from "../api/jobs.api";

export function useJobs(params: JobsListParams) {
  return useQuery({
    queryKey: queryKeys.jobs.list(params),
    queryFn: () => fetchJobs(params),
  });
}
