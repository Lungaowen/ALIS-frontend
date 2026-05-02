import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, FileText, Upload } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { listDocuments } from "@/lib/alis";
import { StatusBadge } from "@/components/app/StatusBadges";

export default function DocumentsPage() {
  const q = useQuery({ queryKey: ["documents"], queryFn: listDocuments });

  return (
    <AppShell
      eyebrow="My documents"
      title="Document index"
      description="Every document you've uploaded, with live ingestion status."
      actions={
        <Button asChild variant="hero">
          <Link to="/dashboard/upload">
            <Upload className="h-4 w-4" /> New upload
          </Link>
        </Button>
      }
    >
      {q.isLoading ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          Loading…
        </div>
      ) : q.isError ? (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-6 text-sm text-destructive">
          {(q.error as Error).message}
        </div>
      ) : (q.data ?? []).length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <FileText className="mx-auto h-6 w-6 text-muted-foreground" />
          <p className="mt-3 text-display text-lg">No documents yet</p>
          <Button asChild variant="hero" size="sm" className="mt-5">
            <Link to="/dashboard/upload"><Upload className="h-4 w-4" /> Upload one</Link>
          </Button>
        </div>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {q.data!.map((d) => (
            <li key={d.documentId}>
              <Link
                to={`/dashboard/documents/${d.documentId}`}
                className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-secondary/50"
              >
                <span className="grid h-9 w-9 place-items-center rounded-md bg-gradient-ink text-primary-foreground">
                  <FileText className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{d.title}</p>
                  <p className="text-xs text-muted-foreground">
                    #{d.documentId} · {new Date(d.uploadedAt).toLocaleString()}
                  </p>
                </div>
                <StatusBadge status={d.status} />
                <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
