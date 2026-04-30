import { listFiles, type PagedFiles } from "@/services/generated";
import type { FilesListParams } from "@/lib/query-keys";

export async function fetchFiles(params: FilesListParams): Promise<PagedFiles> {
  const response = await listFiles({
    query: {
      search: params.search,
      page: params.page,
      pageSize: params.pageSize,
    },
    throwOnError: true,
  });
  return response.data as unknown as PagedFiles;
}
