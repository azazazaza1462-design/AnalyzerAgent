import { useQueries } from "@tanstack/react-query";
import { fetchQueue, getOverrideFor } from "../api";

// Picks the next application after `currentId` that still needs a decision.
// Iteration order = queue order. We hydrate decisions in parallel so the
// component doesn't waterfall when the underwriter lands on the page.
export function useNextInQueue(currentId: string | undefined): {
  nextId: string | undefined;
  remaining: number;
  isLoading: boolean;
} {
  const queueQuery = useQueries({
    queries: [
      {
        queryKey: ["eligibility", "queue"],
        queryFn: fetchQueue,
        staleTime: 30_000,
      },
    ],
  });
  const queue = queueQuery[0].data;

  const overrideQueries = useQueries({
    queries: (queue ?? []).map((a) => ({
      queryKey: ["eligibility", "override", a.application.id],
      queryFn: () => getOverrideFor(a.application.id),
      enabled: Boolean(queue),
    })),
  });

  const isLoading =
    queueQuery[0].isLoading || overrideQueries.some((q) => q.isLoading);

  if (!queue) {
    return { nextId: undefined, remaining: 0, isLoading };
  }

  // An app is "actionable" if it has no recorded decision and isn't still
  // analyzing (no point shipping the user to a pending verdict).
  const actionable = queue
    .map((a, i) => ({ a, decided: Boolean(overrideQueries[i]?.data) }))
    .filter(({ a, decided }) => !decided && a.verdict !== "pending")
    .map(({ a }) => a.application.id);

  const idx = currentId ? actionable.indexOf(currentId) : -1;
  // If the current id is in the list, point to the next one; otherwise pick
  // the first actionable that isn't the current one.
  const nextId =
    idx >= 0
      ? actionable[idx + 1]
      : actionable.find((id) => id !== currentId);

  const remaining = actionable.filter((id) => id !== currentId).length;

  return { nextId, remaining, isLoading };
}
