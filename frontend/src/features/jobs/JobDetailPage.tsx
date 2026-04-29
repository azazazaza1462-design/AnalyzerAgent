import { Link, useParams } from "react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useJob } from "./hooks/use-job";
import { StatusBadge } from "./components/StatusBadge";

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="text-sm">{value ?? "—"}</div>
    </div>
  );
}

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const query = useJob(id);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/jobs">
            <ArrowLeft className="mr-1 size-4" />
            Back
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-semibold">Job Detail</h1>
        <p className="font-mono text-xs text-muted-foreground">{id}</p>
      </div>

      {query.isLoading && (
        <div className="flex h-48 items-center justify-center">
          <Spinner size="lg" />
        </div>
      )}

      {query.isError && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load job: {(query.error as Error).message}
        </div>
      )}

      {query.data && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <Field label="Status" value={<StatusBadge status={String(query.data.jobStatus)} />} />
              <Field label="Type" value={String(query.data.jobType ?? "—")} />
              <Field label="Caller" value={query.data.callerName ?? "—"} />
              <Field label="Machine" value={query.data.machineId ?? "—"} />
              <Field label="Has result" value={query.data.hasResult ? "Yes" : "No"} />
              <Field label="Attachments" value={query.data.attachments?.length ?? 0} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <Field label="Created" value={formatDate(query.data.createdAt)} />
              <Field label="Updated" value={formatDate(query.data.updatedAt)} />
              <Field label="Started" value={formatDate(query.data.startedAt)} />
              <Field label="Finished" value={formatDate(query.data.finishedAt)} />
            </CardContent>
          </Card>

          {query.data.content !== undefined && query.data.content !== null && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Content</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="overflow-auto rounded-md bg-muted p-3 text-xs">
                  {JSON.stringify(query.data.content, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
