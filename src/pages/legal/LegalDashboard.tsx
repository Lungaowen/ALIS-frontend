import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { UploadCloud } from "lucide-react";
import { PortalLayout } from "@/components/app/PortalLayout";
import { StatCard, Spinner, EmptyState } from "@/components/app/Primitives";
import { StatusBadge } from "@/components/app/StatusBadges";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { UploadAndPoll } from "@/components/app/UploadAndPoll";
import { listDocuments, type DocumentItem } from "@/lib/alis";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function LegalDashboardPage() {
  const { session } = useAuth();
  const [docs, setDocs] = useState<DocumentItem[] | null>(null);

  useEffect(() => {
    listDocuments()
      .then((d) => setDocs(Array.isArray(d) ? d : []))
      .catch((e) => { toast.error(e?.message ?? "Failed to load documents"); setDocs([]); });
  }, []);

  if (!docs) return <PortalLayout title="Legal Dashboard"><Spinner /></PortalLayout>;

  const total = docs.length;
  const analyzed = docs.filter((d) => d.status?.toUpperCase() === "ANALYZED").length;
  const pending = docs.filter((d) => ["PENDING", "PROCESSING", "EXTRACTED"].includes(d.status?.toUpperCase() ?? "")).length;
  const high = docs.filter((d) => d.riskLevel === "HIGH").length;
  const recent = [...docs].sort((a, b) => +new Date(b.uploadedAt) - +new Date(a.uploadedAt)).slice(0, 5);

  return (
    <PortalLayout
      title="Legal Dashboard"
      eyebrow="Practitioner"
      description={`Welcome back, ${session?.fullName ?? ""}.`}
      actions={
        <Dialog>
          <DialogTrigger asChild>
            <Button><UploadCloud className="mr-1.5 h-4 w-4" /> Quick upload</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Upload a document</DialogTitle></DialogHeader>
            <UploadAndPoll variant="compact" />
          </DialogContent>
        </Dialog>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="My Documents" value={total} />
        <StatCard label="Analyzed" value={analyzed} tone="accent" />
        <StatCard label="Pending" value={pending} tone="gold" />
        <StatCard label="High Risk" value={high} tone="destructive" />
      </div>

      <div className="mt-6 rounded-lg border border-border bg-card">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold">Recent documents</h2>
        </div>
        {recent.length === 0 ? (
          <EmptyState title="No documents yet" description="Upload your first document to begin compliance analysis." />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              <tr>
                <th className="px-5 py-3 text-left">Title</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Uploaded</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((d) => (
                <tr key={d.documentId} className="border-t border-border">
                  <td className="px-5 py-3 font-medium">{d.title}</td>
                  <td className="px-5 py-3"><StatusBadge status={d.status} /></td>
                  <td className="px-5 py-3 text-muted-foreground">{new Date(d.uploadedAt).toLocaleDateString()}</td>
                  <td className="px-5 py-3 text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link to="/legal/documents">Open</Link>
                    </Button>
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
