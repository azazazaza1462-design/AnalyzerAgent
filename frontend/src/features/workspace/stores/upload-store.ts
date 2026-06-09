import { create } from "zustand";
import type { AnalyzerType } from "../types";

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
}

let seq = 0;

interface UploadStore {
  items: UploadItem[];
  // Stage files for an analyzer (status "ready"). Returns the new keys.
  addFiles: (files: File[], analyzer: AnalyzerType) => void;
  // Move every ready/error item to "uploading", then resolve each to "done".
  // Backend ingestion isn't wired into the redesign yet (mock data), so this
  // simulates progress; swap the timeout for the real /file/upload call later.
  uploadPending: () => void;
  // Stage + immediately upload — used by the dashboard's quick drop.
  addAndUpload: (files: File[], analyzer: AnalyzerType) => void;
  remove: (key: string) => void;
  clear: () => void;
  // Drop only the completed items, keeping anything still in flight.
  clearCompleted: () => void;
}

export const useUploadStore = create<UploadStore>((set, get) => {
  const startUpload = (keys: string[]) => {
    if (keys.length === 0) return;
    set((s) => ({
      items: s.items.map((i) =>
        keys.includes(i.key) ? { ...i, status: "uploading" } : i,
      ),
    }));
    for (const key of keys) {
      window.setTimeout(() => {
        set((s) => ({
          items: s.items.map((i) =>
            i.key === key
              ? { ...i, status: "done", uploadedAt: new Date().toISOString() }
              : i,
          ),
        }));
      }, 700);
    }
  };

  return {
    items: [],
    addFiles: (files, analyzer) => {
      const added: UploadItem[] = files.map((file) => ({
        key: `u-${seq++}`,
        file,
        name: file.name,
        size: file.size,
        mime: file.type || "application/octet-stream",
        analyzer,
        status: "ready",
      }));
      set((s) => ({ items: [...s.items, ...added] }));
    },
    uploadPending: () => {
      const keys = get()
        .items.filter((i) => i.status === "ready" || i.status === "error")
        .map((i) => i.key);
      startUpload(keys);
    },
    addAndUpload: (files, analyzer) => {
      const added: UploadItem[] = files.map((file) => ({
        key: `u-${seq++}`,
        file,
        name: file.name,
        size: file.size,
        mime: file.type || "application/octet-stream",
        analyzer,
        status: "uploading",
      }));
      set((s) => ({ items: [...s.items, ...added] }));
      for (const item of added) {
        window.setTimeout(() => {
          set((s) => ({
            items: s.items.map((i) =>
              i.key === item.key
                ? { ...i, status: "done", uploadedAt: new Date().toISOString() }
                : i,
            ),
          }));
        }, 700);
      }
    },
    remove: (key) => set((s) => ({ items: s.items.filter((i) => i.key !== key) })),
    clear: () => set({ items: [] }),
    clearCompleted: () =>
      set((s) => ({ items: s.items.filter((i) => i.status !== "done") })),
  };
});
