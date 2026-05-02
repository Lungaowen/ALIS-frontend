import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Download, RefreshCcw, ArrowRight } from "lucide-react";
import { PortalLayout } from "@/components/app/PortalLayout";
import { Spinner, EmptyState, ProgressBar } from "@/components/app/Primitives";
import { StatusBadge, RiskBadge } from "@/components/app/StatusBadges";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  downloadReportPdf,
  listDocuments,
  triggerAnalysis,
  type DocumentItem,
} from "@/lib/alis";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function DealerDealsPage() {
  const [docs, setDocs] = useState<DocumentItem[] | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [riskFilter, setRiskFilter] = useState("ALL");
  const [from, setFrom] = useState<Date | undefined>();
  const [to, setTo] = useState<Date | undefined>();
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [analyzingId, setAnalyzingId] = useState<number | null>(null);

  useEffect(() => {
    listDocuments()
      .then((d) => setDocs(Array.isArray(d) ? d : []))
      .catch((e) => {
        toast.error(e?.message ?? "Failed to load");
        setDocs([]);
      });
  }, []);

  const filtered = useMemo(() => {
    if (!docs) return [];
    return docs.filter((d) => {
      if (statusFilter !== "ALL" && d.status?.toUpperCase() !== statusFilter) return false;
      if (riskFilter !== "ALL" && d.riskLevel !== riskFilter) return false;
      const ts = new Date(d.uploadedAt).getTime();
      if (from && ts < from.getTime()) return false;
      if (to && ts > to.getTime() + 86_400_000) return false;
      return true;
    });
  }, [docs, statusFilter, riskFilter, from, to]);

  return (
    <PortalLayout
      title="My Documents"
      eyebrow="Deal Maker"
      description="Browse every deal document you've submitted to ALIS."
    >
      <div className="mb-5 grid gap-3 rounded-lg border border-border bg-card p-4 md:grid-cols-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="EXTRACTED">Extracted</SelectItem>
            <SelectItem value="ANALYZED">Analyzed</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={riskFilter} onValueChange={setRiskFilter}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All risk levels</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
          </SelectContent>
        </Select>
        <DateField label="From" value={from} onChange={setFrom} />
        <DateField label="To" value={to} onChange={setTo} />
      </div>

      {!docs ? <Spinner /> : filtered.length === 0 ? (
        <EmptyState title="No documents yet" description="No documents yet — upload your first deal document." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((d) => (
            <div key={d.documentId} className="flex flex-col rounded-lg border border-border bg-gradient-card p-5 shadow-soft">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-display text-base font-semibold leading-tight">{d.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{new Date(d.uploadedAt).toLocaleDateString()}</p>
                </div>
                <StatusBadge status={d.status} />
              </div>
              <div className="mt-3 flex items-center gap-2">
                {d.riskLevel ? <RiskBadge level={d.riskLevel} /> : <span className="text-xs text-muted-foreground">No risk yet</span>}
              </div>
              {d.similarityScore != null && (
                <div className="mt-3">
                  <p className="text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Compliance score</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <ProgressBar value={d.similarityScore} />
                    <span className="text-xs text-muted-foreground">{Math.round(d.similarityScore)}</span>
                  </div>
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                {d.reportId && (
                  <>
                    <Button size="sm" variant="outline" asChild>
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
            </div>
          ))}
        </div>
      )}
    </PortalLayout>
  );
}

function DateField({ label, value, onChange }: { label: string; value?: Date; onChange: (d?: Date) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn("justify-start text-left font-normal", !value && "text-muted-foreground")}>
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, "PPP") : <span>{label}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={value} onSelect={onChange} initialFocus className="p-3 pointer-events-auto" />
      </PopoverContent>
    </Popover>
  );
}