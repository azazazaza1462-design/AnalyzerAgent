import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchAssessment,
  fetchModelGovernance,
  getOverrideFor,
  postOverride,
} from "../api";
import type { OverrideDecision } from "../types";

export function useAssessment(applicationId: string | undefined) {
  return useQuery({
    queryKey: ["eligibility", "assessment", applicationId],
    queryFn: () => fetchAssessment(applicationId!),
    enabled: Boolean(applicationId),
    staleTime: 30_000,
  });
}

export function useModelGovernance() {
  return useQuery({
    queryKey: ["eligibility", "governance"],
    queryFn: fetchModelGovernance,
    staleTime: 60_000,
  });
}

export function useOverride(applicationId: string | undefined) {
  return useQuery({
    queryKey: ["eligibility", "override", applicationId],
    queryFn: () => getOverrideFor(applicationId!),
    enabled: Boolean(applicationId),
  });
}

export function useRecordOverride(applicationId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (decision: OverrideDecision) => postOverride(decision),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["eligibility", "override", applicationId] });
    },
  });
}
