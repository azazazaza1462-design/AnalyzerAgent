import { Link } from "react-router";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { JobSummary } from "@/services/generated";
import { StatusBadge } from "./StatusBadge";

interface JobsTableProps {
  items: JobSummary[];
}

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

export function JobsTable({ items }: JobsTableProps) {
  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Started</TableHead>
            <TableHead>Finished</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((job) => (
            <TableRow key={job.id}>
              <TableCell className="font-mono text-xs">
                <Link to={`/jobs/${job.id}`} className="text-primary hover:underline">
                  {job.id?.slice(0, 8)}…
                </Link>
              </TableCell>
              <TableCell>{String(job.jobType ?? "—")}</TableCell>
              <TableCell>
                <StatusBadge status={String(job.jobStatus ?? "")} />
              </TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {formatDate(job.createdAt)}
              </TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {formatDate(job.startedAt)}
              </TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {formatDate(job.finishedAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
