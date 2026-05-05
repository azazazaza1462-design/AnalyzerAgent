import { useQuery } from "@tanstack/react-query";
import { queryKeys, type FilesListParams } from "@/lib/query-keys";
import { fetchFiles } from "../api/files.api";

export function useFiles(params: FilesListParams) {
  return useQuery({
    queryKey: queryKeys.files.list(params),
    queryFn: () => fetchFiles(params),
  });
}
