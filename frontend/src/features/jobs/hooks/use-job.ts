import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { fetchJob } from "../api/jobs.api";

export function useJob(id: string | undefined) {
  return useQuery({
    queryKey: id ? queryKeys.jobs.detail(id) : ["jobs", "detail", "skip"],
    queryFn: () => fetchJob(id!),
    enabled: !!id,
  });
}
