import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { FileSummary } from "@/services/generated";

interface FilesTableProps {
  items: FileSummary[];
}

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

function formatBytes(bytes?: number) {
  if (bytes === undefined || bytes === null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function FilesTable({ items }: FilesTableProps) {
  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>File</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Uploaded</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((file) => (
            <TableRow key={file.id}>
              <TableCell className="font-medium">{file.fileName ?? "—"}</TableCell>
              <TableCell className="text-muted-foreground">{file.contentType ?? "—"}</TableCell>
              <TableCell className="text-muted-foreground">{formatBytes(file.sizeBytes)}</TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {formatDate(file.createdAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
