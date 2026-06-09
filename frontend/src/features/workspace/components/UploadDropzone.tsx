import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadDropzoneProps {
  accept: string;
  onFiles: (files: File[]) => void;
  disabled?: boolean;
  // Tighter padding + smaller copy for embedding in a card (dashboard).
  compact?: boolean;
}

// Drag-and-drop surface styled with the ew-* tokens so it reads as part of the
// Workspace. Clicking or pressing Enter/Space opens the native file picker.
export function UploadDropzone({ accept, onFiles, disabled, compact }: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const emit = (list: FileList | null) => {
    if (!list || list.length === 0) return;
    onFiles(Array.from(list));
  };

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => {
        if (!disabled && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        if (!disabled) emit(e.dataTransfer.files);
      }}
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-xl border-[0.5px] border-dashed border-ew-border bg-ew-bg-primary text-center transition-colors",
        compact ? "gap-1.5 px-4 py-6" : "px-6 py-12",
        disabled
          ? "cursor-not-allowed opacity-60"
          : "cursor-pointer hover:border-ew-border-strong",
        isDragging && "border-ew-info-text bg-ew-info-bg/40",
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center rounded-md bg-ew-bg-secondary text-ew-text-secondary",
          compact ? "size-8" : "size-10",
        )}
      >
        <UploadCloud className={compact ? "size-4" : "size-5"} strokeWidth={1.75} />
      </div>
      <div className={cn("font-medium text-ew-text-primary", compact ? "text-[13px]" : "text-[14px]")}>
        Drag &amp; drop {compact ? "" : "files here, or"}{" "}
        <span className="text-ew-info-text">browse</span>
      </div>
      {!compact && (
        <p className="text-[12px] text-ew-text-secondary">PDF or images, up to 25&nbsp;MB each</p>
      )}
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={accept}
        className="hidden"
        onChange={(e) => {
          emit(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
