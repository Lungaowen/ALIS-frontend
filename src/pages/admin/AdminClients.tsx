import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, ChevronLeft, ChevronRight, Loader2, Sparkles, Trash2 } from "lucide-react";
import { PortalLayout } from "@/components/app/PortalLayout";
import { Spinner, EmptyState } from "@/components/app/Primitives";
import { RiskBadge } from "@/components/app/StatusBadges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  adminDeleteClient,
  adminListClients,
  adminListClientsByRole,
  adminUpdateClient,
  getResult,
  type ClientRecord,
  type RiskLevel,
} from "@/lib/alis";
import type { Role } from "@/lib/auth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ROLES: { value: Role | "ALL"; label: string }[] = [
  { value: "ALL", label: "All roles" },
  { value: "USER", label: "User" },
  { value: "LEGAL_PRACTITIONER", label: "Legal Practitioner" },
  { value: "DEAL_MAKER", label: "Deal Maker" },
  { value: "ADMIN", label: "Administrator" },
];

function unwrap(res: unknown): ClientRecord[] {
  if (Array.isArray(res)) return res as ClientRecord[];
  const r = res as { content?: ClientRecord[]; items?: ClientRecord[] };
  return r.content ?? r.items ?? [];
}

function extractTotalPages(res: unknown): number {
  if (Array.isArray(res)) return 1;
  const tp = (res as { totalPages?: number }).totalPages;
  return tp && tp > 0 ? tp : 1;
}

export default function AdminClientsPage() {
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [totalPages, setTotalPages] = useState(1);

  // Filter state
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "ALL">("ALL");
  const [from, setFrom] = useState<Date | undefined>();
  const [to, setTo] = useState<Date | undefined>();

  // Client‑side filtering active only when search or date range is used
  const [useClientFilter, setUseClientFilter] = useState(false);

  // Drawer & delete
  const [selected, setSelected] = useState<ClientRecord | null>(null);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<ClientRecord | null>(null);
  const [riskMap, setRiskMap] = useState<Record<number, RiskLevel | "NONE" | "LOADING">>({});

  // ---------- Data fetching ----------
  const fetchPage = useCallback(async (pageNum: number) => {
    setLoading(true);
    try {
      let res;
      if (useClientFilter) {
        // When search/date are active, fetch all (or as many as possible) to filter in memory
        if (roleFilter === "ALL") {
          res = await adminListClients(0, 9999); // get all clients
        } else {
          res = await adminListClientsByRole(roleFilter, 0, 9999);
        }
        const all = unwrap(res);
        // Apply client‑side filters
        let filtered = all;
        if (search.trim()) {
          const q = search.toLowerCase();
          filtered = filtered.filter(
            (c) =>
              c.fullName.toLowerCase().includes(q) ||
              c.email.toLowerCase().includes(q)
          );
        }
        if (from) {
          const fromDate = new Date(from);
          fromDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(
            (c) => c.registeredAt && new Date(c.registeredAt) >= fromDate
          );
        }
        if (to) {
          const toDate = new Date(to);
          toDate.setHours(23, 59, 59, 999);
          filtered = filtered.filter(
            (c) => c.registeredAt && new Date(c.registeredAt) <= toDate
          );
        }
        setClients(filtered);
        setTotalPages(1); // single page for local filtering
      } else {
        // Server‑side pagination (no search/date active)
        if (roleFilter === "ALL") {
          res = await adminListClients(pageNum, size);
        } else {
          res = await adminListClientsByRole(roleFilter, pageNum, size);
        }
        setClients(unwrap(res));
        setTotalPages(extractTotalPages(res));
      }
    } catch (e) {
      toast.error((e as Error)?.message ?? "Failed to load clients");
      setClients([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [roleFilter, useClientFilter, search, from, to, size]);

  // Initial load & when page or filters change
  useEffect(() => {
    fetchPage(page);
  }, [page, fetchPage]);

  // Determine if we need client‑side filtering
  useEffect(() => {
    setUseClientFilter(!!(search.trim() || from || to));
  }, [search, from, to]);

  // Reset to page 0 whenever filters change
  useEffect(() => {
    setPage(0);
  }, [roleFilter, search, from, to, useClientFilter]);

  const clearFilters = () => {
    setSearch("");
    setRoleFilter("ALL");
    setFrom(undefined);
    setTo(undefined);
  };

  // ---------- Risk helper ----------
  async function fetchRisk(c: ClientRecord) {
    setRiskMap((m) => ({ ...m, [c.clientId]: "LOADING" }));
    try {
      const r = await getResult(c.clientId);
      setRiskMap((m) => ({ ...m, [c.clientId]: r.riskLevel ?? "NONE" }));
    } catch {
      setRiskMap((m) => ({ ...m, [c.clientId]: "NONE" }));
    }
  }

  return (
    <PortalLayout
      title="Client Management"
      eyebrow="Administration"
      description="Search, filter, edit, and audit every client in the platform."
    >
      {/* Filter bar – simplified: no separate apply button; filters auto‑refresh */}
      <div className="mb-5 grid gap-3 rounded-lg border border-border bg-card p-4 md:grid-cols-5">
        <Input
          placeholder="Search by name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as Role | "ALL")}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {ROLES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <DatePickerField label="From" value={from} onChange={setFrom} />
        <DatePickerField label="To" value={to} onChange={setTo} />
        <Button variant="outline" onClick={clearFilters}>Clear</Button>
      </div>

      {loading ? (
        <Spinner label="Loading clients…" />
      ) : clients.length === 0 ? (
        <EmptyState title="No clients found" description="Adjust your filters or invite new users." />
      ) : (
        <div className="rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">Full Name</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-left">Registered</th>
                <th className="px-4 py-3 text-left">Documents</th>
                <th className="px-4 py-3 text-left">AI Risk</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => {
                const risk = riskMap[c.clientId];
                return (
                  <tr key={c.clientId} className="border-t border-border">
                    <td className="px-4 py-3 text-mono text-xs text-muted-foreground">#{c.clientId}</td>
                    <td className="px-4 py-3 font-medium">{c.fullName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-mono text-[10px] uppercase tracking-[0.16em]">
                        {c.role.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {/* prefer createdAt, fallback to registeredAt */}
                      {(c.createdAt || c.registeredAt)
                        ? new Date(c.createdAt ?? c.registeredAt!).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{c.documentCount != null ? c.documentCount : "—"}</td>
                    <td className="px-4 py-3">
                      {risk === "LOADING" ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                      ) : risk && risk !== "NONE" ? (
                        <RiskBadge level={risk as RiskLevel} />
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => fetchRisk(c)}>
                          <Sparkles className="mr-1 h-3 w-3" /> Risk Summary
                        </Button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="outline" onClick={() => { setSelected(c); setEditing(false); }}>
                        View
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination – only show when using server‑side pagination */}
          {!useClientFilter && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <span className="text-xs text-muted-foreground">
                Page {page + 1} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
                  <ChevronLeft className="h-3.5 w-3.5" /> Prev
                </Button>
                <Button size="sm" variant="outline" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  Next <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Drawer */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-md">
          {selected && (
            <ClientDrawer
              client={selected}
              editing={editing}
              setEditing={setEditing}
              onSaved={(updated) => {
                setClients((arr) => arr.map((c) => (c.clientId === updated.clientId ? updated : c)));
                setSelected(updated);
                setEditing(false);
              }}
              onDelete={() => setConfirmDelete(selected)}
            />
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete client?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes <strong>{confirmDelete?.fullName}</strong> and all related records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (!confirmDelete) return;
                try {
                  await adminDeleteClient(confirmDelete.clientId);
                  toast.success("Client deleted");
                  setClients((arr) => arr.filter((c) => c.clientId !== confirmDelete.clientId));
                  setSelected(null);
                  setConfirmDelete(null);
                } catch (e) {
                  toast.error((e as Error)?.message ?? "Delete failed");
                }
              }}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PortalLayout>
  );
}

function DatePickerField({ label, value, onChange }: { label: string; value?: Date; onChange: (d?: Date) => void }) {
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

function ClientDrawer({
  client, editing, setEditing, onSaved, onDelete,
}: {
  client: ClientRecord; editing: boolean; setEditing: (b: boolean) => void;
  onSaved: (c: ClientRecord) => void; onDelete: () => void;
}) {
  const [fullName, setFullName] = useState(client.fullName);
  const [email, setEmail] = useState(client.email);
  const [role, setRole] = useState<Role>(client.role);
  const [active, setActive] = useState(client.active ?? true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFullName(client.fullName); setEmail(client.email); setRole(client.role); setActive(client.active ?? true);
  }, [client]);

  async function save() {
    setSaving(true);
    try {
      const updated = await adminUpdateClient(client.clientId, { fullName, email, role, active });
      toast.success("Client updated");
      onSaved({ ...client, ...updated, fullName, email, role, active });
    } catch (e) {
      toast.error((e as Error)?.message ?? "Update failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <SheetHeader>
        <SheetTitle>{client.fullName}</SheetTitle>
        <SheetDescription>Client ID #{client.clientId} • {client.email}</SheetDescription>
      </SheetHeader>

      <div className="mt-6 space-y-4">
        <Field label="Full Name">
          {editing ? <Input value={fullName} onChange={(e) => setFullName(e.target.value)} /> : <p>{fullName}</p>}
        </Field>
        <Field label="Email">
          {editing ? <Input value={email} onChange={(e) => setEmail(e.target.value)} /> : <p>{email}</p>}
        </Field>
        <Field label="Role">
          {editing ? (
            <Select value={role} onValueChange={(v) => setRole(v as Role)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="USER">User</SelectItem>
                <SelectItem value="LEGAL_PRACTITIONER">Legal Practitioner</SelectItem>
                <SelectItem value="DEAL_MAKER">Deal Maker</SelectItem>
                <SelectItem value="ADMIN">Administrator</SelectItem>
              </SelectContent>
            </Select>
          ) : <Badge variant="outline">{role.replace("_", " ")}</Badge>}
        </Field>
        <Field label="Active">
          <div className="flex items-center gap-2">
            <Switch checked={active} onCheckedChange={setActive} disabled={!editing} />
            <span className="text-sm text-muted-foreground">{active ? "Account enabled" : "Disabled"}</span>
          </div>
        </Field>
        <Field label="Registered">
          <p className="text-sm text-muted-foreground">
            {client.registeredAt ? new Date(client.registeredAt).toLocaleString() : "—"}
          </p>
        </Field>
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        {!editing ? (
          <>
            <Button onClick={() => setEditing(true)}>Edit</Button>
            <Button variant="outline" className="text-destructive" onClick={onDelete}>
              <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
            </Button>
          </>
        ) : (
          <>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />} Save changes
            </Button>
            <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
          </>
        )}
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{label}</Label>
      <div>{children}</div>
    </div>
  );
}