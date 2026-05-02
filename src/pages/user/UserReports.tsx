import { useEffect, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { PortalLayout } from "@/components/app/PortalLayout";
import { Spinner, EmptyState, ProgressBar } from "@/components/app/Primitives";
import { RiskBadge } from "@/components/app/StatusBadges";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { downloadReportPdf, listReportsForClient, type ReportInfo } from "@/lib/alis";
import { toast } from "sonner";

export default function UserReportsPage() {
  const { session } = useAuth();
  const [reports, setReports] = useState<ReportInfo[] | null>(null);
  const [busy, setBusy] = useState<number | null>(null);

  useEffect(() => {
    if (!session) return;
    listReportsForClient(session.clientId)
      .then((r) => setReports(Array.isArray(r) ? r : []))
      .catch((e) => { toast.error(e?.message ?? "Failed to load reports"); setReports([]); });
  }, [session]);

  if (!reports) return <PortalLayout title="My Reports"><Spinner /></PortalLayout>;
  return (
    <PortalLayout title="My Reports" eyebrow="My account" description="Compliance reports generated for your documents.">
      {reports.length === 0 ? (
        <EmptyState title="No reports yet" description="Once your document is analyzed, your report will appear here." />
      ) : (
        <div className="rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              <tr><th className="px-4 py-3 text-left">Document</th><th className="px-4 py-3 text-left">Risk</th><th className="px-4 py-3 text-left w-44">Score</th><th className="px-4 py-3 text-left">Date</th><th className="px-4 py-3 text-right">Action</th></tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.reportId} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{r.documentTitle}</td>
                  <td className="px-4 py-3"><RiskBadge level={r.riskLevel} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <ProgressBar value={r.similarityScore ?? 0} />
                      <span className="text-xs text-muted-foreground">{Math.round(r.similarityScore ?? 0)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(r.generatedAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="outline" onClick={async () => {
                      setBusy(r.reportId);
                      try { await downloadReportPdf(r.reportId, `${r.documentTitle}.pdf`); }
                      catch (e) { toast.error((e as Error)?.message ?? "Download failed"); }
                      finally { setBusy(null); }
                    }}>
                      {busy === r.reportId ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Download className="mr-1 h-3 w-3" /> PDF</>}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PortalLayout>
  );
}
