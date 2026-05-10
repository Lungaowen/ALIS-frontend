import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, FileUp, Loader2, UploadCloud } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { getStatus, uploadDocument, type ComplianceStatus } from "@/lib/alis";
import { StatusBadge } from "@/components/app/StatusBadges";
import {
  DOCUMENT_ACCEPT,
  DOCUMENT_FORMAT_LABEL,
  DOCUMENT_PROCESSING_STEPS,
  MAX_DOCUMENT_SIZE_MB,
  formatFileSize,
  validateDocumentFile,
} from "@/lib/document-processing";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [docId, setDocId] = useState<number | null>(null);
  const [status, setStatus] = useState<ComplianceStatus | null>(null);
  const [progress, setProgress] = useState(8);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const upload = useMutation({
    mutationFn: (f: File) => uploadDocument(f, setProgress),
    onSuccess: (res) => {
      toast.success("Uploaded - analysis started");
      setDocId(res.documentId);
      setProgress((p) => Math.max(p, 25));
      qc.invalidateQueries({ queryKey: ["documents"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Poll status
  useEffect(() => {
    if (!docId) return;
    let cancelled = false;
    let bumps = 0;
    const tick = async () => {
      try {
        const s = await getStatus(docId);
        if (cancelled) return;
        setStatus(s);
        bumps++;
        setProgress((p) => Math.min(95, p + Math.max(2, 8 - bumps)));
        if (s.reportReady) {
          setProgress(100);
          return;
        }
        setTimeout(tick, 2500);
      } catch (e) {
        if (!cancelled) toast.error((e as Error).message);
      }
    };
    tick();
    return () => {
      cancelled = true;
    };
  }, [docId]);

  const selectFile = useCallback((f: File) => {
    const validationError = validateDocumentFile(f);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    setFile(f);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files?.[0];
    if (f) selectFile(f);
  }, [selectFile]);

  const reset = () => {
    setFile(null);
    setDocId(null);
    setStatus(null);
    setProgress(8);
  };

  const ready = status?.reportReady;

  return (
    <AppShell
      eyebrow="Upload & analyze"
      title="Run a compliance analysis"
      description="Upload a supported document. ALIS extracts text, matches active rules, and produces a Groq AI compliance report."
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Drop zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
          className={[
            "relative overflow-hidden rounded-2xl border-2 border-dashed bg-card p-10 text-center transition-all",
            drag ? "border-accent bg-accent/5 scale-[1.01]" : "border-border",
          ].join(" ")}
        >
          <div className="absolute inset-0 bg-grid opacity-30" aria-hidden />
          <div className="relative">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-xl bg-gradient-ink text-primary-foreground shadow-elegant">
              <UploadCloud className="h-6 w-6" />
            </span>
            <h3 className="mt-5 text-display text-2xl font-semibold tracking-tight">
              {file ? file.name : "Drop your document here"}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {file
                ? `${formatFileSize(file.size)} - ready to upload`
                : `${DOCUMENT_FORMAT_LABEL} supported, up to ${MAX_DOCUMENT_SIZE_MB} MB.`}
            </p>

            <input
              ref={inputRef}
              type="file"
              accept={DOCUMENT_ACCEPT}
              className="hidden"
              onChange={(e) => {
                const nextFile = e.target.files?.[0];
                if (nextFile) selectFile(nextFile);
              }}
            />

            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Button variant="outline" onClick={() => inputRef.current?.click()} disabled={upload.isPending || !!docId}>
                <FileUp className="h-4 w-4" /> Choose file
              </Button>
              <Button
                variant="hero"
                onClick={() => file && upload.mutate(file)}
                disabled={!file || upload.isPending || !!docId}
              >
                {upload.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                Upload & analyze
              </Button>
              {(file || docId) && (
                <Button variant="ghost" onClick={reset} disabled={upload.isPending}>
                  Reset
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Status panel */}
        <aside className="rounded-2xl border border-border bg-card p-6">
          <p className="text-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Pipeline
          </p>
          <h4 className="mt-2 text-display text-xl font-semibold tracking-tight">
            {!docId ? "Awaiting upload" : ready ? "Analysis complete" : "Analysis in progress"}
          </h4>

          <div className="mt-5">
            <Progress value={progress} className="h-2" />
            <p className="mt-2 text-xs text-muted-foreground">{progress}% complete</p>
          </div>

          <ul className="mt-6 space-y-3 text-sm">
            {DOCUMENT_PROCESSING_STEPS.map((stage, index) => (
              <Step
                key={stage.title}
                done={
                  index === 0
                    ? !!docId
                    : index === 1
                      ? !!status
                      : index === 2
                        ? !!status && (status.documentStatus ?? "").toUpperCase() !== "PENDING"
                        : !!ready
                }
                label={stage.title}
              />
            ))}
          </ul>

          {status && (
            <div className="mt-6 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <StatusBadge status={status.documentStatus} />
              </div>
              {status.message && (
                <p className="text-xs text-muted-foreground">{status.message}</p>
              )}
            </div>
          )}

          {ready && docId && (
            <Button
              variant="hero"
              className="mt-6 w-full"
              onClick={() => navigate(`/dashboard/documents/${docId}`)}
            >
              View verdict <CheckCircle2 className="h-4 w-4" />
            </Button>
          )}
        </aside>
      </div>
    </AppShell>
  );
}

function Step({ done, label }: { done: boolean; label: string }) {
  return (
    <li className="flex items-center gap-3">
      <span
        className={[
          "grid h-5 w-5 place-items-center rounded-full border transition-colors",
          done ? "border-accent bg-accent text-accent-foreground" : "border-border bg-card text-muted-foreground",
        ].join(" ")}
      >
        {done ? <CheckCircle2 className="h-3 w-3" /> : <Loader2 className="h-3 w-3 animate-spin opacity-60" />}
      </span>
      <span className={done ? "text-foreground" : "text-muted-foreground"}>{label}</span>
    </li>
  );
}
