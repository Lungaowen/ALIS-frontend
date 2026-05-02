import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowUpRight, FileText, Gavel, Sparkles, Upload } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { listDocuments, type DocumentItem } from "@/lib/alis";
import { StatusBadge } from "@/components/app/StatusBadges";

export default function DashboardPage() {
  const { session, role } = useAuth();
  const isClient = role === "USER" || role === "LEGAL_PRACTITIONER" || role === "DEAL_MAKER";

  const docsQ = useQuery({
    queryKey: ["documents"],
    queryFn: listDocuments,
    enabled: isClient,
  });

  const docs: DocumentItem[] = docsQ.data ?? [];
  const analyzed = docs.filter((d) => (d.status ?? "").toUpperCase() === "ANALYZED").length;

  const tagline =
    role === "LEGAL_PRACTITIONER"
      ? "Curate the rule corpus. Audit verdicts. Cite the law that fired."
      : role === "DEAL_MAKER"
      ? "Faster verdicts on the contracts that decide your transactions."
      : role === "ADMIN"
      ? "Operate the platform. Audit everything."
      : "Upload a document. Receive a verdict. Download the report.";

  return (
    <AppShell
      eyebrow={`${role ?? "Workspace"} · welcome`}
      title={`Welcome back, ${session?.fullName?.split(" ")[0] ?? "there"}.`}
      description={tagline}
      actions={
        isClient && (
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="hero" size="lg">
              <Link to="/dashboard/upload">
                <Upload className="h-4 w-4" /> Upload document
              </Link>
            </Button>
            {role === "LEGAL_PRACTITIONER" && (
              <Button asChild variant="outline" size="lg">
                <Link to="/dashboard/rules">
                  <Gavel className="h-4 w-4" /> Rules workspace
                </Link>
              </Button>
            )}
          </div>
        )
      }
    >
      {/* Metrics */}
      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { k: "Documents", v: docsQ.isLoading ? "—" : String(docs.length) },
          { k: "Analyzed", v: docsQ.isLoading ? "—" : String(analyzed) },
          { k: "Role", v: role?.replace("_", " ") ?? "—" },
        ].map((m, i) => (
          <div
            key={m.k}
            className="animate-fade-in-up rounded-xl border border-border bg-card p-5 shadow-soft"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <p className="text-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {m.k}
            </p>
            <p className="mt-2 text-display text-3xl font-semibold tracking-tight">{m.v}</p>
          </div>
        ))}
      </section>

      {/* Recent documents */}
      <section className="mt-10">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <p className="text-mono text-[11px] uppercase tracking-[0.22em] text-accent">Recent</p>
            <h2 className="mt-2 text-display text-2xl font-semibold tracking-tight">Latest documents</h2>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/dashboard/documents">
              View all <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        {docsQ.isLoading ? (
          <div className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
            Loading documents…
          </div>
        ) : docsQ.isError ? (
          <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-6 text-sm text-destructive">
            Could not reach the backend. Set the API base in the header if you're tunneling.
          </div>
        ) : docs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
            <Sparkles className="mx-auto h-6 w-6 text-accent" />
            <p className="mt-3 text-display text-lg">No documents yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Upload your first document to run a compliance analysis.
            </p>
            <Button asChild variant="hero" size="sm" className="mt-5">
              <Link to="/dashboard/upload">
                <Upload className="h-4 w-4" /> Upload now
              </Link>
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {docs.slice(0, 6).map((d) => (
              <li key={d.documentId}>
                <Link
                  to={`/dashboard/documents/${d.documentId}`}
                  className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-secondary/50"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-md bg-gradient-ink text-primary-foreground">
                    <FileText className="h-4 w-4" strokeWidth={1.7} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{d.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Uploaded {new Date(d.uploadedAt).toLocaleString()}
                    </p>
                  </div>
                  <StatusBadge status={d.status} />
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}
