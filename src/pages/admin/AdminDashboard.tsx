import { useEffect, useState } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { PortalLayout } from "@/components/app/PortalLayout";
import { StatCard, Spinner, EmptyState } from "@/components/app/Primitives";
import {
  adminDashboard, adminRecentAudit, type AdminDashboard, type AuditEntry,
} from "@/lib/alis";
import { toast } from "sonner";

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    Promise.all([adminDashboard().catch(() => null), adminRecentAudit(5).catch(() => [])])
      .then(([d, a]) => {
        if (!alive) return;
        setData(d);
        setAudit(Array.isArray(a) ? a : []);
      })
      .catch((e) => toast.error(e?.message ?? "Failed to load dashboard"))
      .finally(() => alive && setLoading(false));
    return () => { alive = false };
  }, []);

  const stats = data?.stats;
  const roleDist = data?.roleDistribution ?? [];
  const trend = (data?.uploadTrend ?? []).map((p) => ({
    label: p.label,
    count: p.count,
  }));

  return (
    <PortalLayout
      title="Admin Dashboard"
      eyebrow="Operations"
      description="Live platform metrics for clients, documents and analyses."
    >
      {loading ? (
        <Spinner label="Loading dashboard…" />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Clients" value={stats?.totalClients ?? 0} />
            <StatCard label="Total Documents" value={stats?.totalDocuments ?? 0} />
            <StatCard label="Total Reports" value={stats?.totalReports ?? 0} tone="accent" />
            <StatCard label="High Risk Reports" value={stats?.highRiskReports ?? 0} tone="destructive" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Active Clients" value={stats?.activeClients ?? 0} />
            <StatCard label="Pending Docs" value={stats?.pendingDocuments ?? 0} />
            <StatCard label="Failed Docs" value={stats?.failedDocuments ?? 0} />
            <StatCard label="Processed Docs" value={stats?.processedDocuments ?? 0} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-5">
              <h2 className="text-base font-semibold">Role distribution</h2>
              <p className="mt-1 text-xs text-muted-foreground">Breakdown of registered users by role.</p>
              <div className="mt-4 h-64">
                {roleDist.length === 0 ? (
                  <EmptyState title="No role data yet" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={roleDist}>
                      <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                      <XAxis dataKey="role" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-5">
              <h2 className="text-base font-semibold">Upload trend</h2>
              <p className="mt-1 text-xs text-muted-foreground">Documents uploaded over time.</p>
              <div className="mt-4 h-64">
                {trend.length === 0 ? (
                  <EmptyState title="No upload activity yet" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trend}>
                      <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-base font-semibold">Recent Platform Documents</h2>
              <p className="mt-1 text-xs text-muted-foreground">Latest 5 uploads across all clients.</p>
            </div>
            {data?.recentDocuments?.length ? (
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 text-left">Title</th>
                    <th className="px-5 py-3 text-left">Client</th>
                    <th className="px-5 py-3 text-left">Status</th>
                    <th className="px-5 py-3 text-left">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentDocuments.slice(0, 5).map((doc) => (
                    <tr key={doc.documentId} className="border-t border-border">
                      <td className="px-5 py-3 font-medium truncate max-w-[200px]">{doc.title}</td>
                      <td className="px-5 py-3">{doc.clientName}</td>
                      <td className="px-5 py-3 capitalize">{doc.status.toLowerCase()}</td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {new Date(doc.uploadedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyState title="No recent documents" />
            )}
          </div>

          <div className="rounded-lg border border-border bg-card">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-base font-semibold">Recent activity</h2>
              <p className="mt-1 text-xs text-muted-foreground">Latest 5 audit events.</p>
            </div>
            {audit.length > 0 ? (
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 text-left">Time</th>
                    <th className="px-5 py-3 text-left">Action</th>
                    <th className="px-5 py-3 text-left">Description</th>
                    <th className="px-5 py-3 text-left">Client</th>
                  </tr>
                </thead>
                <tbody>
                  {audit.map((a) => (
                    <tr key={a.logId} className="border-t border-border">
                      <td className="px-5 py-3 text-muted-foreground">
                        {new Date(a.createdAt).toLocaleString()}
                      </td>
                      <td className="px-5 py-3 font-medium">{a.actionType}</td>
                      <td className="px-5 py-3">{a.description}</td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {a.clientName ?? (a.clientId ? `Client #${a.clientId}` : "—")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyState title="No recent activity" description="Audit events will appear as users interact with ALIS." />
            )}
          </div>
        </div>
      )}
    </PortalLayout>
  );
}