import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { cancelJob } from "../api/jobs.api";

export function useCancelJob(id: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => cancelJob(id!),
    onSuccess: () => {
      if (id) queryClient.invalidateQueries({ queryKey: queryKeys.jobs.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
    },
  });
}
