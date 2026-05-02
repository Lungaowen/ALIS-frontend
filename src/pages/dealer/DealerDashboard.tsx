import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Download, FileText, RefreshCcw, UploadCloud } from "lucide-react";
import { PortalLayout } from "@/components/app/PortalLayout";
import { StatCard, Spinner, EmptyState, ProgressBar } from "@/components/app/Primitives";
import { StatusBadge, RiskBadge } from "@/components/app/StatusBadges";
import { Button } from "@/components/ui/button";
import {
  listDocuments,
  downloadReportPdf,
  triggerAnalysis,
  type DocumentItem,
} from "@/lib/alis";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function DealerDashboardPage() {
  const { session } = useAuth();
  const [docs, setDocs] = useState<DocumentItem[] | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [analyzingId, setAnalyzingId] = useState<number | null>(null);

  useEffect(() => {
    listDocuments()
      .then((d) => setDocs(Array.isArray(d) ? d : []))
      .catch((e) => {
        toast.error(e?.message ?? "Failed to load deals");
        setDocs([]);
      });
  }, []);

  if (!docs) return <PortalLayout title="Deal Overview"><Spinner /></PortalLayout>;

  const submitted = docs.length;
  const ready = docs.filter((d) => d.status?.toUpperCase() === "ANALYZED").length;
  const high = docs.filter((d) => d.riskLevel === "HIGH").length;
  const scores = docs.map((d) => d.similarityScore ?? 0).filter((s) => s > 0);
  const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  return (
    <PortalLayout
      title="Deal Overview"
      eyebrow="Deal Maker"
      description={`Welcome, ${session?.fullName ?? ""} — ${(session as { companyName?: string } | null)?.companyName ?? "Independent"}.`}
      actions={
        <div className="flex gap-2">
          <Button asChild>
            <Link to="/dealer/upload">
              <UploadCloud className="mr-1.5 h-4 w-4" /> Upload New
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/dealer/risk">
              <FileText className="mr-1.5 h-4 w-4" /> Latest Report
            </Link>
          </Button>
        </div>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Documents Submitted" value={submitted} />
        <StatCard label="Reports Ready" value={ready} tone="accent" />
        <StatCard label="High Risk Deals" value={high} tone="destructive" />
        <StatCard label="Avg. Compliance Score" value={`${avg}%`} tone="gold" />
      </div>

      <div className="mt-6 rounded-lg border border-border bg-card">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold">Deal Pipeline</h2>
        </div>
        {docs.length === 0 ? (
          <EmptyState title="No deals submitted yet" description="Upload your first document to begin compliance review." />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              <tr>
                <th className="px-5 py-3 text-left">Document</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Risk</th>
                <th className="px-5 py-3 text-left w-44">Score</th>
                <th className="px-5 py-3 text-left">Ready</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d) => (
                <tr key={d.documentId} className="border-t border-border">
                  <td className="px-5 py-3 font-medium">{d.title}</td>
                  <td className="px-5 py-3"><StatusBadge status={d.status} /></td>
                  <td className="px-5 py-3">{d.riskLevel ? <RiskBadge level={d.riskLevel} /> : "—"}</td>
                  <td className="px-5 py-3">
                    {d.similarityScore != null ? (
                      <div className="flex items-center gap-2">
                        <ProgressBar value={d.similarityScore} />
                        <span className="text-xs text-muted-foreground">{Math.round(d.similarityScore)}</span>
                      </div>
                    ) : "—"}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {d.status?.toUpperCase() === "ANALYZED" ? "Yes" : "Pending"}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex justify-end gap-1.5">
                      {d.reportId && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            asChild
                          >
                            <Link to="/dealer/risk">View Report</Link>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              setDownloadingId(d.reportId!);
                              try {
                                await downloadReportPdf(d.reportId!, `${d.title}.pdf`);
                              } catch (e) {
                                toast.error((e as Error)?.message ?? "Download failed");
                              } finally {
                                setDownloadingId(null);
                              }
                            }}
                            disabled={downloadingId === d.reportId}
                          >
                            <Download className="mr-1 h-3.5 w-3.5" />
                            {downloadingId === d.reportId ? "Downloading…" : "PDF"}
                          </Button>
                        </>
                      )}
                      {!d.reportId && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={async () => {
                            setAnalyzingId(d.documentId);
                            try {
                              await triggerAnalysis(d.documentId);
                              toast.success("Analysis started");
                            } catch (e) {
                              toast.error((e as Error)?.message ?? "Could not start analysis");
                            } finally {
                              setAnalyzingId(null);
                            }
                          }}
                          disabled={analyzingId === d.documentId}
                        >
                          <RefreshCcw className={`mr-1 h-3.5 w-3.5 ${analyzingId === d.documentId ? "animate-spin" : ""}`} />
                          Analyze
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </PortalLayout>
  );
}