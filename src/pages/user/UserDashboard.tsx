import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { UploadCloud } from "lucide-react";
import { PortalLayout } from "@/components/app/PortalLayout";
import { StatCard, Spinner, EmptyState } from "@/components/app/Primitives";
import { StatusBadge } from "@/components/app/StatusBadges";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { listDocuments, type DocumentItem } from "@/lib/alis";
import { toast } from "sonner";

export default function UserDashboardPage() {
  const { session } = useAuth();
  const [docs, setDocs] = useState<DocumentItem[] | null>(null);
  useEffect(() => {
    listDocuments().then((d) => setDocs(Array.isArray(d) ? d : []))
      .catch((e) => { toast.error(e?.message ?? "Failed to load"); setDocs([]); });
  }, []);
  if (!docs) return <PortalLayout title="Home"><Spinner /></PortalLayout>;
  const ready = docs.filter((d) => d.status?.toUpperCase() === "ANALYZED").length;
  return (
    <PortalLayout
      title="Home"
      eyebrow="Welcome"
      description={`Hi ${session?.fullName ?? ""}, here's a quick look at your account.`}
      actions={<Button asChild><Link to="/user/upload"><UploadCloud className="mr-1.5 h-4 w-4" /> Upload Document</Link></Button>}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="My Documents" value={docs.length} />
        <StatCard label="Reports Ready" value={ready} tone="accent" />
        <StatCard label="In Progress" value={docs.length - ready} tone="gold" />
      </div>
      <div className="mt-6 rounded-lg border border-border bg-card">
        <div className="border-b border-border px-5 py-4"><h2 className="text-base font-semibold">Recent uploads</h2></div>
        {docs.length === 0 ? (
          <EmptyState title="No documents yet" description="Upload a document to get started." />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              <tr><th className="px-5 py-3 text-left">Title</th><th className="px-5 py-3 text-left">Status</th><th className="px-5 py-3 text-left">Uploaded</th></tr>
            </thead>
            <tbody>
              {docs.slice(0, 5).map((d) => (
                <tr key={d.documentId} className="border-t border-border">
                  <td className="px-5 py-3 font-medium">{d.title}</td>
                  <td className="px-5 py-3"><StatusBadge status={d.status} /></td>
                  <td className="px-5 py-3 text-muted-foreground">{new Date(d.uploadedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </PortalLayout>
  );
}
