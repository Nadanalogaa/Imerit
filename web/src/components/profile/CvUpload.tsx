import { useRef, useState } from "react";
import { FileText, Trash2, Upload, Download } from "lucide-react";

/**
 * CV upload widget for the candidate profile. Accepts PDF/DOC/DOCX up to
 * 5 MB and stores the file as a base64 data URL — same storage pattern as
 * PhotoUpload / employer logo. Employer, admin and super-admin roles can
 * later render the same download button from the stored data URL.
 *
 * Wired via two props: `value` (the current data URL, or undefined) and
 * `fileName` (the original filename, shown on the download button). Emits
 * both on change; pass empty strings to signal a clear.
 */

const ACCEPT = ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB — matches the schema cap after
                                    // base64 padding (~7.5 MB on the wire).

const MIME_WHITELIST = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export function CvUpload({
  value,
  fileName,
  onChange,
}: {
  value?: string;
  fileName?: string;
  onChange: (dataUrl: string | undefined, fileName: string | undefined) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const openPicker = () => {
    setError(null);
    inputRef.current?.click();
  };

  const clear = () => {
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
    onChange(undefined, undefined);
  };

  const handleFile = (file: File) => {
    // Extension-based fallback for browsers that don't recognise the doc
    // MIME type on drag/drop.
    const nameLower = file.name.toLowerCase();
    const looksRight =
      MIME_WHITELIST.has(file.type) ||
      nameLower.endsWith(".pdf") ||
      nameLower.endsWith(".doc") ||
      nameLower.endsWith(".docx");
    if (!looksRight) {
      setError("Only PDF, DOC, or DOCX files are supported.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(`File is ${(file.size / (1024 * 1024)).toFixed(1)} MB — max is 5 MB.`);
      return;
    }
    setBusy(true);
    const reader = new FileReader();
    reader.onload = () => {
      setBusy(false);
      const result = reader.result;
      if (typeof result !== "string") {
        setError("Could not read the file. Try again.");
        return;
      }
      onChange(result, file.name);
    };
    reader.onerror = () => {
      setBusy(false);
      setError("Could not read the file. Try again.");
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      {value ? (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50/60 px-3 py-2 dark:border-emerald-500/30 dark:bg-emerald-500/10">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
            <FileText size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-emerald-900 dark:text-emerald-100">
              {fileName ?? "Uploaded CV"}
            </p>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-300/80">
              Employers, admins and reviewers can download this file when viewing your profile.
            </p>
          </div>
          <a
            href={value}
            download={fileName ?? "resume.pdf"}
            className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-white/70 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-white dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-200 dark:hover:bg-emerald-500/25"
          >
            <Download size={12} /> Download
          </a>
          <button
            type="button"
            onClick={openPicker}
            className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-white/70 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-white dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-200 dark:hover:bg-emerald-500/25"
          >
            <Upload size={12} /> Replace
          </button>
          <button
            type="button"
            onClick={clear}
            className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-white/70 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-white dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20"
          >
            <Trash2 size={12} /> Remove
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={openPicker}
          disabled={busy}
          className="flex items-center gap-3 rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50 px-4 py-4 text-left transition hover:border-brand-400 hover:bg-brand-50/40 dark:border-zinc-700 dark:bg-zinc-950/50 dark:hover:border-brand-500/50 dark:hover:bg-brand-500/5"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-500/15 text-brand-600 dark:text-brand-300">
            <Upload size={18} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">{busy ? "Reading file…" : "Upload your CV"}</p>
            <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
              PDF, DOC or DOCX up to 5 MB. Employers can download this from your profile.
            </p>
          </div>
        </button>
      )}
      {error && <p className="text-[11px] text-rose-600">{error}</p>}
    </div>
  );
}
