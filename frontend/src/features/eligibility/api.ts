// Mock API layer. Async-shaped so migrating to a real backend later is a
// drop-in: replace each function body with an axios/fetch call.
import {
  APP_48213,
  MODEL_GOVERNANCE,
  QUEUE_ITEMS,
  getOverride,
  recordOverride,
} from "./data/mock";
import type { EligibilityAssessment, ModelGovernance, OverrideDecision } from "./types";

function delay<T>(value: T, ms = 120): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export async function fetchQueue(): Promise<EligibilityAssessment[]> {
  return delay(QUEUE_ITEMS);
}

export async function fetchAssessment(
  applicationId: string,
): Promise<EligibilityAssessment | undefined> {
  const match = QUEUE_ITEMS.find((q) => q.application.id === applicationId) ?? APP_48213;
  return delay(match);
}

export async function fetchModelGovernance(): Promise<ModelGovernance> {
  return delay(MODEL_GOVERNANCE);
}

export async function getOverrideFor(applicationId: string): Promise<OverrideDecision | undefined> {
  return delay(getOverride(applicationId));
}

export async function postOverride(decision: OverrideDecision): Promise<OverrideDecision> {
  recordOverride(decision);
  return delay(decision);
}
