// Async-shaped mock API. Replace each body with a real fetch when the backend
// is wired; consumers shouldn't need to change.
import { DOCUMENTS, JOBS, summarize } from "./data/mock";
import type { AnalyzerJob, DocumentRecord, JobQueueSummary, JobStatus } from "./types";

function delay<T>(value: T, ms = 120): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export interface JobsListParams {
  status?: JobStatus;
  from?: string; // ISO date (inclusive)
  to?: string; // ISO date (inclusive)
}

export async function fetchJobQueueSummary(): Promise<JobQueueSummary> {
  return delay(summarize(JOBS));
}

export async function fetchJobs(
  params: JobsListParams = {},
): Promise<AnalyzerJob[]> {
  const fromMs = params.from ? Date.parse(params.from) : undefined;
  // `to` is inclusive: bump to the end of the day so a filter "to=2026-06-08"
  // includes anything created on that calendar day.
  const toMs = params.to ? Date.parse(params.to) + 86_400_000 - 1 : undefined;

  const filtered = JOBS.filter((j) => {
    if (params.status && j.status !== params.status) return false;
    const t = Date.parse(j.createdAt);
    if (fromMs !== undefined && t < fromMs) return false;
    if (toMs !== undefined && t > toMs) return false;
    return true;
  }).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

  return delay(filtered);
}

export interface DocumentsListParams {
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface PagedDocuments {
  items: DocumentRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export async function fetchDocuments(
  params: DocumentsListParams = {},
): Promise<PagedDocuments> {
  const search = params.search?.trim().toLowerCase();
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 25;

  const matched = DOCUMENTS.filter((d) =>
    !search ? true : d.name.toLowerCase().includes(search),
  ).sort((a, b) => Date.parse(b.uploadedAt) - Date.parse(a.uploadedAt));

  const start = (page - 1) * pageSize;
  return delay({
    items: matched.slice(start, start + pageSize),
    total: matched.length,
    page,
    pageSize,
  });
}
