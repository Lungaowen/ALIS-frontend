import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PortalLayout } from "@/components/app/PortalLayout";
import { Spinner, EmptyState } from "@/components/app/Primitives";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { adminClientAudit, adminRecentAudit, type AuditEntry } from "@/lib/alis";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ACTIONS = ["ALL", "UPLOAD", "ANALYSIS_RUN", "DOCUMENT_VIEWED", "LOGIN"];

export default function AdminAuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("ALL");
  const [from, setFrom] = useState<Date | undefined>();
  const [to, setTo] = useState<Date | undefined>();
  const [clientLookup, setClientLookup] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    adminRecentAudit(100)
      .then((rows) => setEntries(Array.isArray(rows) ? rows : []))
      .catch((e) => toast.error(e?.message ?? "Failed to load audit log"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (action !== "ALL" && e.actionType !== action) return false;
      if (search && !`${e.description} ${e.actionType}`.toLowerCase().includes(search.toLowerCase())) return false;
      const ts = new Date(e.timestamp).getTime();
      if (from && ts < from.getTime()) return false;
      if (to && ts > to.getTime() + 86_400_000) return false;
      return true;
    });
  }, [entries, action, search, from, to]);

  async function viewByClient() {
    const id = parseInt(clientLookup, 10);
    if (!id) return toast.error("Enter a valid Client ID");
    setLoading(true);
    try {
      const rows = await adminClientAudit(id);
      setEntries(Array.isArray(rows) ? rows : []);
      toast.success(`Loaded events for client #${id}`);
    } catch (e) {
      toast.error((e as Error)?.message ?? "Lookup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PortalLayout
      title="Audit Log Explorer"
      eyebrow="Administration"
      description="Inspect every meaningful action taken across ALIS."
    >
      <div className="mb-5 grid gap-3 rounded-lg border border-border bg-card p-4 lg:grid-cols-6">
        <Input className="lg:col-span-2" placeholder="Search description or action" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select value={action} onValueChange={setAction}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {ACTIONS.map((a) => <SelectItem key={a} value={a}>{a === "ALL" ? "All actions" : a}</SelectItem>)}
          </SelectContent>
        </Select>
        <DateField label="From" value={from} onChange={setFrom} />
        <DateField label="To" value={to} onChange={setTo} />
        <div className="flex gap-2">
          <Input placeholder="Client ID" value={clientLookup} onChange={(e) => setClientLookup(e.target.value)} />
          <Button variant="outline" onClick={viewByClient}>By Client</Button>
        </div>
      </div>

      {loading ? (
        <Spinner label="Loading audit log…" />
      ) : filtered.length === 0 ? (
        <EmptyState title="No audit entries match" description="Try widening your filters." />
      ) : (
        <div className="rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Log ID</th>
                <th className="px-4 py-3 text-left">Timestamp</th>
                <th className="px-4 py-3 text-left">Action</th>
                <th className="px-4 py-3 text-left">Description</th>
                <th className="px-4 py-3 text-left">Client</th>
                <th className="px-4 py-3 text-left">Document</th>
                <th className="px-4 py-3 text-left">IP Address</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.logId} className="border-t border-border">
                  <td className="px-4 py-3 text-mono text-xs text-muted-foreground">#{e.logId}</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(e.timestamp).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="text-mono text-[10px] uppercase tracking-[0.16em]">{e.actionType}</Badge>
                  </td>
                  <td className="px-4 py-3">{e.description}</td>
                  <td className="px-4 py-3">
                    {e.clientId ? (
                      <button className="story-link text-accent hover:underline" onClick={() => navigate(`/admin/clients?id=${e.clientId}`)}>
                        Client #{e.clientId}
                      </button>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{e.documentId ? `Doc #${e.documentId}` : "—"}</td>
                  <td className="px-4 py-3 text-mono text-xs text-muted-foreground">{e.ipAddress ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
