// Real API layer over the generated OpenAPI SDK. Consumers (hooks) keep the
// same function shapes; the mapping backend<->frontend lives in ./mappers.
import { getJob, getJobResult, listFiles, listJobs } from "@/services/generated/sdk.gen";
import type { JobDetail, PagedFiles, PagedJobs } from "@/services/generated/types.gen";
import { summarize } from "./data/mock";
import { detailToRun, fileToDocument, summaryToJob } from "./mappers";
import type {
  AnalyzerJob,
  DocumentRecord,
  IdValidationResult,
  JobQueueSummary,
  JobRun,
  JobStatus,
} from "./types";

export interface JobsListParams {
  status?: JobStatus;
  from?: string; // ISO date (inclusive)
  to?: string; // ISO date (inclusive)
}

// The job list endpoint is paginated and lean; we pull a generous page and
// filter/sort client-side (small volumes, and it sidesteps the enum query
// representation). Bump to server-side filters if the queue grows.
async function fetchAllJobs(): Promise<AnalyzerJob[]> {
  const { data, error } = await listJobs({ query: { page: 1, pageSize: 100 } });
  if (error) throw new Error("Failed to load jobs.");
  const paged = data as unknown as PagedJobs | undefined;
  return (paged?.items ?? []).map(summaryToJob);
}

export async function fetchJobs(params: JobsListParams = {}): Promise<AnalyzerJob[]> {
  const fromMs = params.from ? Date.parse(params.from) : undefined;
  const toMs = params.to ? Date.parse(params.to) + 86_400_000 - 1 : undefined;

  return (await fetchAllJobs())
    .filter((j) => {
      if (params.status && j.status !== params.status) return false;
      const t = Date.parse(j.createdAt);
      if (fromMs !== undefined && t < fromMs) return false;
      if (toMs !== undefined && t > toMs) return false;
      return true;
    })
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export async function fetchJobQueueSummary(): Promise<JobQueueSummary> {
  return summarize(await fetchAllJobs());
}

/** Full run detail for the Job Detail page: JobDetail + result_data. */
export async function fetchJobRun(id: string): Promise<JobRun> {
  const { data, error } = await getJob({ path: { id } });
  const detail = data as unknown as JobDetail | undefined;
  if (error || !detail) throw new Error("Failed to load job.");

  let result: IdValidationResult | null = null;
  let failure: string | null = null;

  if (detail.hasResult) {
    const { data } = await getJobResult({ path: { id } });
    const blob = data as Record<string, unknown> | null;
    if (blob && typeof blob === "object") {
      if ("verdict" in blob) result = blob as unknown as IdValidationResult;
      else if ("error" in blob) failure = String(blob.error);
    }
  }

  return detailToRun(detail, result, failure);
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
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 25;
  const { data, error } = await listFiles({
    query: { search: params.search, page, pageSize },
  });
  if (error) throw new Error("Failed to load files.");
  const paged = data as unknown as PagedFiles | undefined;
  return {
    items: (paged?.items ?? []).map(fileToDocument),
    total: paged?.total ?? 0,
    page: paged?.page ?? page,
    pageSize: paged?.pageSize ?? pageSize,
  };
}
