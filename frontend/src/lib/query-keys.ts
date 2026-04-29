// String union matches the actual JSON the API sends. The generated JobStatus
// type ("0 | 1 | 2 | 3") is wrong because Swashbuckle currently emits enum
// indices instead of the string names; revisit when the backend Swagger config
// is fixed (AddSwaggerGen + AddJsonOptions for string enums).
export type JobStatusName = "Pending" | "InProgress" | "Completed" | "Failed";

export interface JobsListParams {
  status?: JobStatusName;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export const queryKeys = {
  jobs: {
    all: ["jobs"] as const,
    list: (params: JobsListParams) => ["jobs", "list", params] as const,
    detail: (id: string) => ["jobs", "detail", id] as const,
  },
  auth: {
    me: ["auth", "me"] as const,
  },
} as const;
