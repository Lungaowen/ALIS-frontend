import { useEffect, useState } from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { PortalLayout } from "@/components/app/PortalLayout";
import { StatCard, Spinner, EmptyState } from "@/components/app/Primitives";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  adminInactiveClients, adminRegistrationTrend, adminReportSummary,
  adminRoleDistribution, adminTopUploaders,
  TopUploaderResponse,
  type RegistrationTrendRow, type RoleDistributionRow, type TopUploaderRow,
} from "@/lib/alis";
import { toast } from "sonner";

const COLORS = ["hsl(var(--accent))", "hsl(var(--primary))", "hsl(var(--gold))", "hsl(var(--destructive))"];

export default function AdminReportsPage() {
  return (
    <PortalLayout title="Platform Reports" eyebrow="Analytics" description="Aggregate insights across ALIS.">
      <Tabs defaultValue="summary" className="w-full">
        <TabsList>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="role">Role Distribution</TabsTrigger>
          <TabsTrigger value="trend">Registration Trend</TabsTrigger>
          <TabsTrigger value="top">Top Uploaders</TabsTrigger>
        </TabsList>
        <TabsContent value="summary"><SummaryTab /></TabsContent>
        <TabsContent value="role"><RoleTab /></TabsContent>
        <TabsContent value="trend"><TrendTab /></TabsContent>
        <TabsContent value="top"><TopTab /></TabsContent>
      </Tabs>
    </PortalLayout>
  );
}

function SummaryTab() {
  const [data, setData] = useState<Record<string, number | string> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminReportSummary()
      .then(setData)
      .catch((e) => toast.error(e?.message ?? "Failed to load summary"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner label="Loading summary…" />;
  if (!data) return <EmptyState title="No summary data" />;

  // keep only entries with a real value (skip null / undefined)
  const entries = Object.entries(data).filter(
    ([, value]) => value !== null && value !== undefined
  );

  if (entries.length === 0) return <EmptyState title="No summary data" />;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {entries.map(([key, value]) => (
        <StatCard
          key={key}
          label={key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()).trim()}
          value={String(value)}
        />
      ))}
    </div>
  );
}
function RoleTab() {
  const [rows, setRows] = useState<RoleDistributionRow[]>([]);
  const [totalClients, setTotalClients] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminRoleDistribution()
      .then((res) => {
        const mapped: RoleDistributionRow[] = Object.entries(res.countByRole).map(
          ([role, count]) => ({
            role,
            count,
            percentage: (count / res.totalClients) * 100,
          })
        );
        setRows(mapped);
        setTotalClients(res.totalClients);
      })
      .catch((e) => toast.error(e?.message ?? "Failed to load role distribution"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (rows.length === 0) return <EmptyState title="No role data" />;

  return (
    <div className="space-y-4">
      <StatCard label="Total Clients" value={totalClients} />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={rows}
                  dataKey="count"
                  nameKey="role"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                >
                  {rows.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-left">Count</th>
                <th className="px-4 py-3 text-left">Percentage</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.role} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{r.role.replace(/_/g, " ")}</td>
                  <td className="px-4 py-3">{r.count}</td>
                  <td className="px-4 py-3">{r.percentage?.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function TrendTab() {
  const [months, setMonths] = useState("12");
  const [rows, setRows] = useState<{ label: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    adminRegistrationTrend(parseInt(months, 10))
      .then((res) => {
        const mapped = res.trend.map((p) => {
          const date = new Date(p.year, p.month - 1, 1);
          const label = date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
          }); // e.g. "Apr 2026"
          return { label, count: p.count };
        });
        setRows(mapped);
      })
      .catch((e) => toast.error(e?.message ?? "Failed to load trend"))
      .finally(() => setLoading(false));
  }, [months]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Client registrations per month.</p>
        <Select value={months} onValueChange={setMonths}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="3">Last 3 months</SelectItem>
            <SelectItem value="6">Last 6 months</SelectItem>
            <SelectItem value="12">Last 12 months</SelectItem>
            <SelectItem value="24">Last 24 months</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {loading ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <EmptyState title="No registrations recorded" />
      ) : (
        <div className="h-80 rounded-lg border border-border bg-card p-5">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rows}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                stroke="hsl(var(--accent))"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function TopTab() {
  const [rows, setRows] = useState<TopUploaderResponse['content']>([]);
  const [inactive, setInactive] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminTopUploaders(0, 10).catch(() => null),
      adminInactiveClients().catch(() => ({ count: 0 })),
    ]).then(([topRes, inactiveRes]) => {
      if (topRes?.content) setRows(topRes.content);
      const count = Array.isArray(inactiveRes)
        ? inactiveRes.length
        : (inactiveRes as { count?: number })?.count ?? 0;
      setInactive(count);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      <StatCard label="Inactive Clients" value={inactive} hint="No uploads in the recent window" />
      {rows.length === 0 ? (
        <EmptyState title="No upload activity yet" />
      ) : (
        <div className="rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Rank</th>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-left">Documents Uploaded</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item, index) => (
                <tr key={item.clientId} className="border-t border-border">
                  <td className="px-4 py-3 text-mono text-xs text-muted-foreground">
                    #{index + 1}
                  </td>
                  <td className="px-4 py-3 font-medium">{item.fullName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{item.email}</td>
                  <td className="px-4 py-3">{item.role.replace(/_/g, " ")}</td>
                  <td className="px-4 py-3">{item.documentCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
