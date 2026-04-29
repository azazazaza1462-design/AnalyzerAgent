import { listJobs, getJob, type JobDetail, type PagedJobs } from "@/services/generated";
import type { JobsListParams } from "@/lib/query-keys";

// The generated SDK collapses object response types to a union of their value
// types (a quirk of @hey-api/client-axios's RequestResult). We cast the
// response data back to the intended shape here so consumers see the right
// types.

export async function fetchJobs(params: JobsListParams): Promise<PagedJobs> {
  const response = await listJobs({
    query: {
      status: params.status as never,
      from: params.from,
      to: params.to,
      page: params.page,
      pageSize: params.pageSize,
    },
    throwOnError: true,
  });
  return response.data as unknown as PagedJobs;
}

export async function fetchJob(id: string): Promise<JobDetail> {
  const response = await getJob({
    path: { id },
    throwOnError: true,
  });
  return response.data as unknown as JobDetail;
}
