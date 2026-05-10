import { Fragment, useEffect, useMemo, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { PortalLayout } from "@/components/app/PortalLayout";
import { EmptyState, Gauge, ProgressBar, Spinner } from "@/components/app/Primitives";
import { RiskBadge } from "@/components/app/StatusBadges";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { downloadReportPdf, getReportById, listReportsForClient, type ReportInfo } from "@/lib/alis";
import { toast } from "sonner";

export default function LegalReportsPage() {
  const { session } = useAuth();
  const [reports, setReports] = useState<ReportInfo[] | null>(null);
  const [expandedReport, setExpandedReport] = useState<ReportInfo | null>(null);
  const [loadingReportId, setLoadingReportId] = useState<number | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  useEffect(() => {
    if (!session) return;
    listReportsForClient(session.clientId)
      .then((r) => setReports(Array.isArray(r) ? r : []))
      .catch((e) => {
        toast.error(e?.message ?? "Failed to load reports");
        setReports([]);
      });
  }, [session]);

  const summary = useMemo(() => {
    if (!reports || reports.length === 0) return null;
    const avg = Math.round(reports.reduce((a, r) => a + (r.similarityScore ?? 0), 0) / reports.length);
    const counts = { LOW: 0, MEDIUM: 0, HIGH: 0 } as Record<string, number>;
    reports.forEach((r) => {
      counts[r.riskLevel] = (counts[r.riskLevel] ?? 0) + 1;
    });
    const mostCommon = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-";
    return { avg, mostCommon, total: reports.length };
  }, [reports]);

  async function toggleReport(report: ReportInfo) {
    if (expandedReport?.reportId === report.reportId) {
      setExpandedReport(null);
      return;
    }

    setLoadingReportId(report.reportId);
    try {
      setExpandedReport(await getReportById(report.reportId));
    } catch (e) {
      toast.error((e as Error)?.message ?? "Failed to load report");
    } finally {
      setLoadingReportId(null);
    }
  }

  async function download(report: ReportInfo) {
    setDownloadingId(report.reportId);
    try {
      await downloadReportPdf(report.reportId);
    } catch (e) {
      toast.error((e as Error)?.message ?? "Download failed");
    } finally {
      setDownloadingId(null);
    }
  }

  if (!reports) return <PortalLayout title="My Compliance Reports"><Spinner /></PortalLayout>;

  return (
    <PortalLayout
      title="My Compliance Reports"
      eyebrow="Practitioner"
      description="Every analysis ALIS has produced for documents under your account."
    >
      {summary && (
        <div className="mb-6 grid gap-6 rounded-lg border border-accent/30 bg-accent/5 p-6 sm:grid-cols-3">
          <div className="flex flex-col items-center">
            <Gauge value={summary.avg} label="Avg. similarity" />
          </div>
          <div className="flex flex-col items-center justify-center">
            <p className="text-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Most common risk</p>
            <div className="mt-2">
              <RiskBadge level={summary.mostCommon as "LOW" | "MEDIUM" | "HIGH"} />
            </div>
          </div>
          <div className="flex flex-col items-center justify-center">
            <p className="text-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Total reports</p>
            <p className="mt-1 text-display text-3xl font-semibold">{summary.total}</p>
          </div>
        </div>
      )}

      {reports.length === 0 ? (
        <EmptyState title="No compliance reports yet" description="Upload a document to generate your first AI report." />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Report ID</th>
                  <th className="px-4 py-3 text-left">Document</th>
                  <th className="px-4 py-3 text-left">Act</th>
                  <th className="px-4 py-3 text-left">Risk</th>
                  <th className="w-48 px-4 py-3 text-left">Score</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <Fragment key={report.reportId}>
                    <tr className="border-t border-border">
                      <td className="px-4 py-3 text-mono text-xs text-muted-foreground">#{report.reportId}</td>
                      <td className="px-4 py-3 font-medium">{report.documentTitle}</td>
                      <td className="px-4 py-3 text-muted-foreground">{report.actName ?? "-"}</td>
                      <td className="px-4 py-3">
                        <RiskBadge level={report.riskLevel} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <ProgressBar value={report.similarityScore ?? 0} />
                          <span className="text-xs text-muted-foreground">{Math.round(report.similarityScore ?? 0)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{new Date(report.generatedAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={loadingReportId === report.reportId}
                          onClick={() => void toggleReport(report)}
                        >
                          {loadingReportId === report.reportId && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                          {expandedReport?.reportId === report.reportId ? "Hide" : "View"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={downloadingId === report.reportId}
                          onClick={() => void download(report)}
                        >
                          {downloadingId === report.reportId ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Download className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </td>
                    </tr>
                    {expandedReport?.reportId === report.reportId && (
                      <tr className="bg-muted/30">
                        <td colSpan={7} className="px-4 py-4">
                          <div className="grid gap-4 lg:grid-cols-2">
                            <blockquote className="rounded-md border-l-4 border-accent bg-card p-4 text-sm">
                              <p className="font-medium">AI Recommendation</p>
                              <p className="mt-2 whitespace-pre-wrap text-muted-foreground">{expandedReport.aiRecommendation}</p>
                            </blockquote>
                            <div className="space-y-3">
                              <div>
                                <p className="text-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">AI Explanation</p>
                                <p className="mt-1 text-sm text-muted-foreground">{expandedReport.aiExplanation}</p>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Rule: <span className="font-medium text-foreground">{expandedReport.lawRuleKeyword ?? "-"}</span> | Act:{" "}
                                <span className="font-medium text-foreground">{expandedReport.actName ?? "-"}</span>
                              </div>
                              <p className="text-[11px] text-muted-foreground">
                                Powered by {expandedReport.modelVersion ?? "llama-3.3-70b-versatile"}
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </PortalLayout>
  );
}
