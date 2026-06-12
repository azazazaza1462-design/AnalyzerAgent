import { create } from "zustand";
import { createJob } from "@/services/generated/sdk.gen";
import type { JobType } from "@/services/generated/types.gen";
import { toBackendJobType } from "../mappers";
import type { AnalyzerType } from "../types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

const MIME_BY_EXT: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
};

// The backend allowlist requires a known content type. Browsers sometimes
// hand us a File with an empty or unexpected type (screenshots, some phone
// exports), so fall back to the extension and fail loudly if unsupported.
function resolveMime(file: File): string {
  const allowed = new Set(["application/pdf", "image/png", "image/jpeg"]);
  if (allowed.has(file.type)) return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const byExt = MIME_BY_EXT[ext];
  if (byExt) return byExt;
  throw new Error(
    `Unsupported file type${ext ? ` (.${ext})` : ""}. Use PDF, PNG, or JPG.`,
  );
}

async function uploadOne(file: File): Promise<string> {
  const mime = resolveMime(file);
  const form = new FormData();
  // Wrap in a Blob with the resolved type so the multipart part carries a
  // content-type the server accepts.
  form.append("file", new Blob([file], { type: mime }), file.name);

  const res = await fetch(`${API_BASE}/api/v1/file/upload`, {
    method: "POST",
    body: form,
    credentials: "include",
  });
  if (!res.ok) {
    const problem = (await res.json().catch(() => null)) as
      | { detail?: string; title?: string; errors?: Record<string, string[]> }
      | null;
    const firstError = problem?.errors
      ? Object.values(problem.errors).flat()[0]
      : undefined;
    throw new Error(firstError ?? problem?.detail ?? problem?.title ?? `Upload failed (${res.status}).`);
  }
  const body = (await res.json()) as { fileId?: string };
  if (!body.fileId) throw new Error("Upload succeeded but no file id was returned.");
  return body.fileId;
}

export type UploadStatus = "ready" | "uploading" | "done" | "error";

export interface UploadItem {
  key: string;
  file: File;
  name: string;
  size: number;
  mime: string;
  analyzer: AnalyzerType;
  status: UploadStatus;
  // ISO timestamp set when the upload completes; drives the "history" view.
  uploadedAt?: string;
  // Job created from this upload (the agent processes it).
  jobId?: string;
  error?: string;
}

let seq = 0;

interface UploadStore {
  items: UploadItem[];
  addFiles: (files: File[], analyzer: AnalyzerType) => void;
  // Upload every ready/error item, then create one job per file.
  uploadPending: () => void;
  // Stage + immediately upload — used by the dashboard's quick drop.
  addAndUpload: (files: File[], analyzer: AnalyzerType) => void;
  remove: (key: string) => void;
  clear: () => void;
  clearCompleted: () => void;
}

function newItem(file: File, analyzer: AnalyzerType): UploadItem {
  return {
    key: `u-${seq++}`,
    file,
    name: file.name,
    size: file.size,
    mime: file.type || "application/octet-stream",
    analyzer,
    status: "ready",
  };
}

export const useUploadStore = create<UploadStore>((set, get) => {
  const mark = (key: string, patch: Partial<UploadItem>) =>
    set((s) => ({ items: s.items.map((i) => (i.key === key ? { ...i, ...patch } : i)) }));

  // Real ingest: upload the file, then create an analyzer job for it. The
  // agent claims the job and runs the analysis.
  const runItem = async (key: string) => {
    const item = get().items.find((i) => i.key === key);
    if (!item) return;
    mark(key, { status: "uploading", error: undefined });
    try {
      const fileId = await uploadOne(item.file);

      const created = await createJob({
        body: {
          caller: "Lendlogic LOS",
          jobType: toBackendJobType(item.analyzer) as unknown as JobType,
          content: { documentType: item.analyzer, attachments: [fileId] },
          attachments: [fileId],
        },
      });
      if (created.error) throw new Error("Could not create the analyzer job.");
      const jobId = (created.data as { jobId?: string } | undefined)?.jobId;

      mark(key, { status: "done", uploadedAt: new Date().toISOString(), jobId });
    } catch (e) {
      mark(key, { status: "error", error: e instanceof Error ? e.message : "Upload failed." });
    }
  };

  return {
    items: [],
    addFiles: (files, analyzer) =>
      set((s) => ({ items: [...s.items, ...files.map((f) => newItem(f, analyzer))] })),
    uploadPending: () => {
      get()
        .items.filter((i) => i.status === "ready" || i.status === "error")
        .forEach((i) => void runItem(i.key));
    },
    addAndUpload: (files, analyzer) => {
      const added = files.map((f) => newItem(f, analyzer));
      set((s) => ({ items: [...s.items, ...added] }));
      added.forEach((i) => void runItem(i.key));
    },
    remove: (key) => set((s) => ({ items: s.items.filter((i) => i.key !== key) })),
    clear: () => set({ items: [] }),
    clearCompleted: () =>
      set((s) => ({ items: s.items.filter((i) => i.status !== "done") })),
  };
});
