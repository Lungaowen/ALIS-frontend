import { useCallback, useEffect, useRef, useState } from "react";
import { Download, RefreshCcw, Sparkles } from "lucide-react";
import { PortalLayout } from "@/components/app/PortalLayout";
import { Spinner, EmptyState, ProgressBar, Gauge } from "@/components/app/Primitives";
import { StatusBadge, RiskBadge } from "@/components/app/StatusBadges";
import { Button } from "@/components/ui/button";
import { UploadAndPoll } from "@/components/app/UploadAndPoll";
import {
  listDocuments, getStatus, getResult, triggerAnalysis, downloadReportPdf,
  type DocumentItem, type ReportInfo,
} from "@/lib/alis";
import { toast } from "sonner";

export default function LegalDocumentsPage() {
  const [docs, setDocs] = useState<DocumentItem[] | null>(null);
  const [aiByDoc, setAiByDoc] = useState<Record<number, ReportInfo>>({});
  const [busyId, setBusyId] = useState<number | null>(null);
  const pollers = useRef<Record<number, number>>({});

  const load = useCallback(() => {
    listDocuments()
      .then((d) => setDocs(Array.isArray(d) ? d : []))
      .catch((e) => { toast.error(e?.message ?? "Failed to load"); setDocs([]); });
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => () => Object.values(pollers.current).forEach((id) => window.clearInterval(id)), []);

  function pollDoc(documentId: number) {
    if (pollers.current[documentId]) return;
    setBusyId(documentId);
    pollers.current[documentId] = window.setInterval(async () => {
      try {
        const s = await getStatus(documentId);
        if (s.reportReady) {
          window.clearInterval(pollers.current[documentId]);
          delete pollers.current[documentId];
          setBusyId(null);
          const r = await getResult(documentId);
          setAiByDoc((m) => ({ ...m, [documentId]: r }));
          toast.success("Analysis complete");
          load();
        } else if (s.documentStatus === "FAILED" || s.analysisStatus === "FAILED") {
          window.clearInterval(pollers.current[documentId]);
          delete pollers.current[documentId];
          setBusyId(null);
          toast.error("Analysis failed");
        }
      } catch { /* keep silent */ }
    }, 3000);
  }

  async function reanalyze(d: DocumentItem) {
    try {
      await triggerAnalysis(d.documentId);
      toast.success("Re-analysis started");
      pollDoc(d.documentId);
    } catch (e) {
      toast.error((e as Error)?.message ?? "Could not start analysis");
    }
  }

  if (!docs) return <PortalLayout title="Document Centre"><Spinner /></PortalLayout>;

  return (
    <PortalLayout
      title="Document Centre"
      eyebrow="Practitioner"
      description="Upload PDFs, monitor analysis status, and review AI compliance findings."
    >
      <div className="space-y-6">
        <UploadAndPoll variant="compact" onCompleted={() => load()} />

        {docs.length === 0 ? (
          <EmptyState title="No documents yet" description="Drop a PDF above to start your first compliance analysis." />
        ) : (
          <div className="rounded-lg border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Title</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Uploaded</th>
                  <th className="px-4 py-3 text-left">Risk</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {docs.map((d) => {
                  const ai = aiByDoc[d.documentId];
                  const analyzed = d.status?.toUpperCase() === "ANALYZED";
                  return (
                    <>
                      <tr key={d.documentId} className="border-t border-border">
                        <td className="px-4 py-3 font-medium">{d.title}</td>
                        <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                        <td className="px-4 py-3 text-muted-foreground">{new Date(d.uploadedAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3">{d.riskLevel ? <RiskBadge level={d.riskLevel} /> : "—"}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => pollDoc(d.documentId)} disabled={busyId === d.documentId}>
                              {busyId === d.documentId ? "Polling…" : "Check Status"}
                            </Button>
                            <Button size="sm" variant="outline" disabled={!analyzed} onClick={async () => {
                              try {
                                const r = await getResult(d.documentId);
                                setAiByDoc((m) => ({ ...m, [d.documentId]: r }));
                              } catch (e) { toast.error((e as Error)?.message ?? "No report yet"); }
                            }}>View Report</Button>
                            <Button size="sm" variant="ghost" onClick={() => reanalyze(d)}>
                              <RefreshCcw className="mr-1 h-3 w-3" /> Re-analyze
                            </Button>
                          </div>
                        </td>
                      </tr>
                      {ai && (
                        <tr className="border-t border-border bg-accent/5">
                          <td colSpan={5} className="px-4 py-4">
                            <div className="flex flex-wrap items-center gap-6">
                              <div className="flex items-center gap-2 text-mono text-[10px] uppercase tracking-[0.2em] text-accent">
                                <Sparkles className="h-3 w-3" /> AI Insight
                              </div>
                              <Gauge value={ai.riskLevel === "LOW" ? 90 : ai.riskLevel === "MEDIUM" ? 60 : 25} size={84} label="Risk" tone={ai.riskLevel === "LOW" ? "accent" : ai.riskLevel === "MEDIUM" ? "gold" : "destructive"} />
                              <Gauge value={ai.similarityScore ?? 0} size={84} label="Similarity" tone="primary" />
                              <p className="max-w-xl text-sm text-muted-foreground">
                                {ai.aiRecommendation?.slice(0, 100) ?? ""}{ai.aiRecommendation && ai.aiRecommendation.length > 100 ? "…" : ""}
                              </p>
                              <Button size="sm" variant="outline" onClick={() => downloadReportPdf(ai.reportId, `${ai.documentTitle}.pdf`)}>
                                <Download className="mr-1 h-3 w-3" /> PDF
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
