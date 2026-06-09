import { useQuery } from "@tanstack/react-query";
import { fetchQueue } from "../api";

export function useQueue() {
  return useQuery({
    queryKey: ["eligibility", "queue"],
    queryFn: fetchQueue,
    staleTime: 30_000,
  });
}
