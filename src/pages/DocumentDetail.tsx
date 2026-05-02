import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Download, FileText, Loader2 } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { downloadReportPdf, getDocument, getDocumentReports, type ReportInfo } from "@/lib/alis";
import { RiskBadge, StatusBadge } from "@/components/app/StatusBadges";
import { toast } from "sonner";

export default function DocumentDetailPage() {
  const { id } = useParams();
  const docId = Number(id);

  const docQ = useQuery({
    queryKey: ["document", docId],
    queryFn: () => getDocument(docId),
    enabled: Number.isFinite(docId),
  });
  const reportsQ = useQuery({
    queryKey: ["document-reports", docId],
    queryFn: () => getDocumentReports(docId),
    enabled: Number.isFinite(docId),
    refetchInterval: (q) => ((q.state.data?.length ?? 0) > 0 ? false : 4000),
  });

  const handleDownload = async (r: ReportInfo) => {
    try {
      await downloadReportPdf(r.reportId, `${r.documentTitle.replace(/\.[^.]+$/, "")}-report.pdf`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <AppShell
      eyebrow="Document detail"
      title={docQ.data?.title ?? `Document #${docId}`}
      description="Verdict, risk grade, and downloadable PDF report."
      actions={
        <Button asChild variant="ghost">
          <Link to="/dashboard/documents">
            <ArrowLeft className="h-4 w-4" /> All documents
          </Link>
        </Button>
      }
    >
      {/* Document summary */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-center gap-4">
          <span className="grid h-11 w-11 place-items-center rounded-md bg-gradient-ink text-primary-foreground">
            <FileText className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-display text-xl font-semibold">{docQ.data?.title ?? "—"}</p>
            <p className="text-xs text-muted-foreground">
              #{docId}
              {docQ.data?.uploadedAt && ` · uploaded ${new Date(docQ.data.uploadedAt).toLocaleString()}`}
            </p>
          </div>
          <StatusBadge status={docQ.data?.status} />
        </div>
      </div>

      {/* Reports */}
      <div className="mt-8">
        <h2 className="text-display text-2xl font-semibold tracking-tight">Compliance reports</h2>

        {reportsQ.isLoading ? (
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading reports…
          </div>
        ) : (reportsQ.data ?? []).length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-border bg-card p-10 text-center">
            <Loader2 className="mx-auto h-5 w-5 animate-spin text-accent" />
            <p className="mt-3 text-display text-lg">Analysis still running</p>
            <p className="mt-1 text-sm text-muted-foreground">
              This page will refresh automatically when the verdict is ready.
            </p>
          </div>
        ) : (
          <div className="mt-4 grid gap-4">
            {reportsQ.data!.map((r) => (
              <article key={r.reportId} className="ring-gradient rounded-xl p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                      Report #{r.reportId} · {r.modelVersion}
                    </p>
                    <h3 className="mt-1 text-display text-xl font-semibold">
                      {r.actName ?? "Compliance verdict"}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {r.lawRuleKeyword && <>Rule: <span className="text-foreground">{r.lawRuleKeyword}</span> · </>}
                      similarity {Number(r.similarityScore).toFixed(1)}%
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <RiskBadge level={r.riskLevel} />
                    <StatusBadge status={r.analysisStatus} />
                    <Button variant="hero" size="sm" onClick={() => handleDownload(r)}>
                      <Download className="h-4 w-4" /> Download PDF
                    </Button>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-mono text-[10px] uppercase tracking-[0.18em] text-accent">Recommendation</p>
                    <p className="mt-1 text-sm leading-relaxed">{r.aiRecommendation}</p>
                  </div>
                  <div>
                    <p className="text-mono text-[10px] uppercase tracking-[0.18em] text-accent">Explanation</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{r.aiExplanation}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
