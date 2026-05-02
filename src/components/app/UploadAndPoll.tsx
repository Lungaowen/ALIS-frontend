import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, UploadCloud, FileCheck2, AlertCircle, Sparkles, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ProgressBar, Gauge } from "@/components/app/Primitives";
import { RiskBadge } from "@/components/app/StatusBadges";
import {
  uploadDocument, getStatus, getResult, downloadReportPdf, triggerAnalysis,
  type ComplianceStatus, type ReportInfo,
} from "@/lib/alis";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Step = "idle" | "uploading" | "uploaded" | "processing" | "ready" | "failed";

interface Props {
  onCompleted?: (result: ReportInfo) => void;
  variant?: "compact" | "full";
  showReadiness?: boolean; // Deal Maker readiness gauge + verdict
}

export function UploadAndPoll({ onCompleted, variant = "full", showReadiness = false }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState<Step>("idle");
  const [docId, setDocId] = useState<number | null>(null);
  const [status, setStatus] = useState<ComplianceStatus | null>(null);
  const [result, setResult] = useState<ReportInfo | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const pollRef = useRef<number | null>(null);
  const navigate = useNavigate();

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => () => stopPolling(), [stopPolling]);

  const startPolling = useCallback((id: number) => {
    stopPolling();
    setStep("processing");
    pollRef.current = window.setInterval(async () => {
      try {
        const s = await getStatus(id);
        setStatus(s);
        if (s.documentStatus === "FAILED" || s.analysisStatus === "FAILED") {
          stopPolling();
          setStep("failed");
          toast.error("Analysis failed");
        } else if (s.reportReady) {
          stopPolling();
          setStep("ready");
          try {
            const r = await getResult(id);
            setResult(r);
            onCompleted?.(r);
          } catch (e) {
            toast.error("Could not load AI result");
          }
        }
      } catch {
        // keep polling silently
      }
    }, 3000);
  }, [onCompleted, stopPolling]);

  async function handleFile(f: File) {
    if (f.type !== "application/pdf") {
      toast.error("Please upload a PDF file");
      return;
    }
    setFile(f);
    setStep("uploading");
    setProgress(0);
    try {
      const res = await uploadDocument(f, setProgress);
      toast.success("Upload complete");
      setDocId(res.documentId);
      setStep("uploaded");
      startPolling(res.documentId);
    } catch (e) {
      setStep("failed");
      toast.error((e as Error)?.message ?? "Upload failed");
    }
  }

  async function reanalyze() {
    if (!docId) return;
    try {
      await triggerAnalysis(docId);
      toast.success("Re-analysis triggered");
      startPolling(docId);
    } catch (e) {
      toast.error((e as Error)?.message ?? "Could not re-analyze");
    }
  }

  // Deal Maker readiness score
  const readiness = result
    ? Math.round(
        (result.similarityScore ?? 0) * 0.6 +
        (result.riskLevel === "LOW" ? 40 : result.riskLevel === "MEDIUM" ? 20 : 0)
      )
    : 0;
  const verdict = readiness >= 70 ? "READY TO PROCEED" : readiness >= 40 ? "REVIEW REQUIRED" : "HIGH RISK — DO NOT PROCEED";
  const verdictTone = readiness >= 70 ? "text-accent" : readiness >= 40 ? "text-gold" : "text-destructive";

  return (
    <div className="space-y-6">
      {/* Drop zone */}
      <label
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files?.[0];
          if (f) handleFile(f);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed bg-card transition-colors",
          variant === "full" ? "px-8 py-12" : "px-6 py-8",
          dragOver ? "border-accent bg-accent/5" : "border-border hover:border-accent/60"
        )}
      >
        <UploadCloud className="h-10 w-10 text-muted-foreground" strokeWidth={1.5} />
        <p className="mt-3 text-base font-medium">
          {file ? file.name : "Drop a PDF here or click to browse"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">PDF only • 50 MB max</p>
        <input
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
      </label>

      {step === "uploading" && (
        <div className="space-y-2 rounded-lg border border-border bg-card p-4">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Uploading…</span>
            <span>{progress}%</span>
          </div>
          <ProgressBar value={progress} />
        </div>
      )}

      {(step === "uploaded" || step === "processing" || step === "ready" || step === "failed") && (
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Analysis pipeline
          </h3>
          <ol className="mt-4 grid gap-3 sm:grid-cols-3">
            <Stepper step={1} label="Uploaded" state="done" />
            <Stepper
              step={2} label="Processing"
              state={step === "processing" ? "current" : step === "ready" ? "done" : step === "failed" ? "failed" : "pending"}
            />
            <Stepper
              step={3} label="Report Ready"
              state={step === "ready" ? "done" : step === "failed" ? "failed" : "pending"}
            />
          </ol>
          {status?.message && (
            <p className="mt-4 text-xs text-muted-foreground">{status.message}</p>
          )}
        </div>
      )}

      {step === "ready" && result && (
        <div className="rounded-lg border border-accent/30 bg-accent/5 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-mono text-[10px] uppercase tracking-[0.2em] text-accent">
                <Sparkles className="mr-1 inline h-3 w-3" /> AI Result
              </p>
              <h3 className="mt-1 text-display text-xl font-semibold">{result.documentTitle}</h3>
              <div className="mt-2 flex items-center gap-2">
                <RiskBadge level={result.riskLevel} />
                <span className="text-xs text-muted-foreground">
                  Similarity {Math.round(result.similarityScore ?? 0)}%
                </span>
              </div>
            </div>
            {showReadiness && (
              <div className="flex flex-col items-center">
                <Gauge value={readiness} label="Readiness" tone={readiness >= 70 ? "accent" : readiness >= 40 ? "gold" : "destructive"} />
                <p className={cn("mt-2 text-mono text-[11px] font-semibold uppercase tracking-[0.2em]", verdictTone)}>
                  {verdict}
                </p>
              </div>
            )}
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div>
              <p className="text-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Similarity Score</p>
              <div className="mt-2"><ProgressBar value={result.similarityScore ?? 0} /></div>
              <p className="mt-1 text-xs text-muted-foreground">{Math.round(result.similarityScore ?? 0)} / 100</p>
            </div>
            <div className="text-xs text-muted-foreground">
              Powered by {result.modelVersion ?? "llama-3.3-70b-versatile"}
            </div>
          </div>

          <blockquote className="mt-5 rounded-md border-l-4 border-accent bg-card p-4 text-sm">
            <p className="font-medium text-foreground">AI Recommendation</p>
            <p className="mt-2 whitespace-pre-wrap text-muted-foreground">{result.aiRecommendation}</p>
          </blockquote>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button onClick={() => downloadReportPdf(result.reportId, `${result.documentTitle}.pdf`)}>
              <Download className="mr-1.5 h-3.5 w-3.5" /> Download Report
            </Button>
            <Button variant="outline" onClick={reanalyze}>Re-analyze</Button>
            <Button variant="ghost" onClick={() => navigate(`/legal/documents`)}>View all documents</Button>
          </div>
        </div>
      )}

      {step === "failed" && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4" />
          <div>
            <p className="font-medium">Analysis unavailable — try again.</p>
            {docId && <Button size="sm" variant="outline" className="mt-2" onClick={reanalyze}>Retry analysis</Button>}
          </div>
        </div>
      )}
    </div>
  );
}

function Stepper({ step, label, state }: { step: number; label: string; state: "pending" | "current" | "done" | "failed" }) {
  const colors = {
    pending: "border-border text-muted-foreground bg-card",
    current: "border-accent text-accent bg-accent/5",
    done: "border-accent bg-accent text-accent-foreground",
    failed: "border-destructive bg-destructive/10 text-destructive",
  } as const;
  return (
    <li className={cn("flex items-center gap-3 rounded-md border p-3", colors[state])}>
      <span className="grid h-7 w-7 place-items-center rounded-full border border-current text-mono text-xs font-semibold">
        {state === "done" ? <FileCheck2 className="h-4 w-4" /> : state === "current" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : step}
      </span>
      <span className="text-sm font-medium">{label}</span>
    </li>
  );
}
