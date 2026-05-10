import { useEffect, useState } from "react";
import { PortalLayout } from "@/components/app/PortalLayout";
import { Spinner, EmptyState } from "@/components/app/Primitives";
import { StatusBadge, RiskBadge } from "@/components/app/StatusBadges";
import { listDocuments, type DocumentItem } from "@/lib/alis";
import { toast } from "sonner";

export default function UserDocumentsPage() {
  const [docs, setDocs] = useState<DocumentItem[] | null>(null);
  useEffect(() => {
    listDocuments().then((d) => setDocs(Array.isArray(d) ? d : []))
      .catch((e) => { toast.error(e?.message ?? "Failed to load"); setDocs([]); });
  }, []);
  if (!docs) return <PortalLayout title="My Documents"><Spinner /></PortalLayout>;
  return (
    <PortalLayout title="My Documents" eyebrow="My account" description="Every document you've uploaded.">
      {docs.length === 0 ? (
        <EmptyState title="No documents yet" description="Upload a document to see it here." />
      ) : (
        <div className="rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              <tr><th className="px-4 py-3 text-left">Title</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3 text-left">Risk</th><th className="px-4 py-3 text-left">Uploaded</th></tr>
            </thead>
            <tbody>
              {docs.map((d) => (
                <tr key={d.documentId} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{d.title}</td>
                  <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                  <td className="px-4 py-3">{d.riskLevel ? <RiskBadge level={d.riskLevel} /> : "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(d.uploadedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PortalLayout>
  );
}
