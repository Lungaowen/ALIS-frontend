import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, ChevronLeft, ChevronRight, Loader2, Trash2 } from "lucide-react";
import { PortalLayout } from "@/components/app/PortalLayout";
import { Spinner, EmptyState } from "@/components/app/Primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  adminDocumentCount,
  adminFilterClients,
  adminGetClient,
  adminListClients,
  adminUpdateClient,
  type ClientFilter,
  type ClientRecord,
} from "@/lib/alis";
import type { Role } from "@/lib/auth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ROLES: { value: Role | "ALL"; label: string }[] = [
  { value: "ALL", label: "All roles" },
  { value: "LEGAL_PRACTITIONER", label: "Legal Practitioner" },
  { value: "DEAL_MAKER", label: "Deal Maker" },
  { value: "ADMIN", label: "Administrator" },
  { value: "USER", label: "Legacy User" },
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

function formatDateTime(date: Date, endOfDay = false) {
  const d = new Date(date);
  d.setHours(endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function documentTotal(c: ClientRecord) {
  return c.documentsUploaded ?? c.documentCount;
}

export default function AdminClientsPage() {
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "ALL">("ALL");
  const [from, setFrom] = useState<Date | undefined>();
  const [to, setTo] = useState<Date | undefined>();
  const [selected, setSelected] = useState<ClientRecord | null>(null);
  const [editing, setEditing] = useState(false);
  const [detailLoadingId, setDetailLoadingId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ClientRecord | null>(null);

  const fetchPage = useCallback(async () => {
    setLoading(true);
    try {
      const filter: ClientFilter = {};
      if (search.trim()) filter.searchQuery = search.trim();
      if (roleFilter !== "ALL") filter.role = roleFilter;
      if (from) filter.registeredFrom = formatDateTime(from);
      if (to) filter.registeredTo = formatDateTime(to, true);

      const hasFilter = !!(filter.searchQuery || filter.role || filter.registeredFrom || filter.registeredTo);
      const res = hasFilter
        ? await adminFilterClients(filter, page, size)
        : await adminListClients(page, size);

      setClients(unwrap(res));
      setTotalPages(extractTotalPages(res));
    } catch (e) {
      toast.error((e as Error)?.message ?? "Failed to load clients");
      setClients([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [from, page, roleFilter, search, size, to]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  useEffect(() => {
    setPage(0);
  }, [search, roleFilter, from, to]);

  const clearFilters = () => {
    setSearch("");
    setRoleFilter("ALL");
    setFrom(undefined);
    setTo(undefined);
  };

  async function openClient(client: ClientRecord) {
    setDetailLoadingId(client.clientId);
    try {
      const detail = await adminGetClient(client.clientId);
      let documentsUploaded = detail.documentsUploaded ?? detail.documentCount;
      if (documentsUploaded == null) {
        documentsUploaded = await adminDocumentCount(client.clientId).catch(() => undefined);
      }
      const hydrated = { ...client, ...detail, documentsUploaded };
      setSelected(hydrated);
      setEditing(false);
    } catch (e) {
      toast.error((e as Error)?.message ?? "Could not load client detail");
    } finally {
      setDetailLoadingId(null);
    }
  }

  return (
    <PortalLayout
      title="Client Management"
      eyebrow="Administration"
      description="Search, filter, edit, and audit platform accounts."
    >
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
        <Spinner label="Loading clients..." />
      ) : clients.length === 0 ? (
        <EmptyState title="No clients found" description="Adjust your filters and try again." />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">ID</th>
                  <th className="px-4 py-3 text-left">Full Name</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Role</th>
                  <th className="px-4 py-3 text-left">Registered</th>
                  <th className="px-4 py-3 text-left">Documents</th>
                  <th className="px-4 py-3 text-left">Specialist Detail</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c.clientId} className="border-t border-border">
                    <td className="px-4 py-3 text-mono text-xs text-muted-foreground">#{c.clientId}</td>
                    <td className="px-4 py-3 font-medium">{c.fullName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-mono text-[10px] uppercase tracking-[0.16em]">
                        {String(c.role).replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {(c.createdAt || c.registeredAt)
                        ? new Date(c.createdAt ?? c.registeredAt!).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{documentTotal(c) ?? "-"}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {c.role === "DEAL_MAKER"
                        ? c.companyName ?? c.dealSpecialty ?? "-"
                        : c.role === "LEGAL_PRACTITIONER"
                        ? c.lawFirm ?? c.barNumber ?? "-"
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="outline" onClick={() => openClient(c)} disabled={detailLoadingId === c.clientId}>
                        {detailLoadingId === c.clientId && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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
        </div>
      )}

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          {selected && (
            <ClientDrawer
              client={selected}
              editing={editing}
              setEditing={setEditing}
              onSaved={(updated) => {
                setClients((arr) => arr.map((c) => (c.clientId === updated.clientId ? { ...c, ...updated } : c)));
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
              This permanently removes <strong>{confirmDelete?.fullName}</strong> and related records.
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
  client: ClientRecord;
  editing: boolean;
  setEditing: (b: boolean) => void;
  onSaved: (c: ClientRecord) => void;
  onDelete: () => void;
}) {
  const [fullName, setFullName] = useState(client.fullName);
  const [email, setEmail] = useState(client.email);
  const [username, setUsername] = useState(client.username ?? "");
  const [role, setRole] = useState<Role>(client.role);
  const [barNumber, setBarNumber] = useState(client.barNumber ?? "");
  const [lawFirm, setLawFirm] = useState(client.lawFirm ?? "");
  const [companyName, setCompanyName] = useState(client.companyName ?? "");
  const [dealSpecialty, setDealSpecialty] = useState(client.dealSpecialty ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFullName(client.fullName);
    setEmail(client.email);
    setUsername(client.username ?? "");
    setRole(client.role);
    setBarNumber(client.barNumber ?? "");
    setLawFirm(client.lawFirm ?? "");
    setCompanyName(client.companyName ?? "");
    setDealSpecialty(client.dealSpecialty ?? "");
  }, [client]);

  async function save() {
    setSaving(true);
    try {
      const body = {
        fullName,
        email,
        username,
        role,
        barNumber: role === "LEGAL_PRACTITIONER" ? barNumber || null : null,
        lawFirm: role === "LEGAL_PRACTITIONER" ? lawFirm || null : null,
        companyName: role === "DEAL_MAKER" ? companyName || null : null,
        dealSpecialty: role === "DEAL_MAKER" ? dealSpecialty || null : null,
      };
      const updated = await adminUpdateClient(client.clientId, body as Partial<ClientRecord>);
      toast.success("Client updated");
      onSaved({ ...client, ...updated, ...body });
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
        <SheetDescription>Client ID #{client.clientId} - {client.email}</SheetDescription>
      </SheetHeader>

      <div className="mt-6 space-y-4">
        <Field label="Full Name">
          {editing ? <Input value={fullName} onChange={(e) => setFullName(e.target.value)} /> : <p>{fullName}</p>}
        </Field>
        <Field label="Email">
          {editing ? <Input value={email} onChange={(e) => setEmail(e.target.value)} /> : <p>{email}</p>}
        </Field>
        <Field label="Username">
          {editing ? <Input value={username} onChange={(e) => setUsername(e.target.value)} /> : <p>{username || "-"}</p>}
        </Field>
        <Field label="Role">
          {editing ? (
            <Select value={role} onValueChange={(v) => setRole(v as Role)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="LEGAL_PRACTITIONER">Legal Practitioner</SelectItem>
                <SelectItem value="DEAL_MAKER">Deal Maker</SelectItem>
                <SelectItem value="ADMIN">Administrator</SelectItem>
                <SelectItem value="USER">Legacy User</SelectItem>
              </SelectContent>
            </Select>
          ) : <Badge variant="outline">{String(role).replace(/_/g, " ")}</Badge>}
        </Field>
        <Field label="Registered">
          <p className="text-sm text-muted-foreground">
            {(client.createdAt || client.registeredAt) ? new Date(client.createdAt ?? client.registeredAt!).toLocaleString() : "-"}
          </p>
        </Field>
        <Field label="Documents Uploaded">
          <p>{documentTotal(client) ?? "-"}</p>
        </Field>

        {role === "LEGAL_PRACTITIONER" && (
          <>
            <Field label="Bar Number">
              {editing ? <Input value={barNumber} onChange={(e) => setBarNumber(e.target.value)} /> : <p>{barNumber || "-"}</p>}
            </Field>
            <Field label="Law Firm">
              {editing ? <Input value={lawFirm} onChange={(e) => setLawFirm(e.target.value)} /> : <p>{lawFirm || "-"}</p>}
            </Field>
          </>
        )}

        {role === "DEAL_MAKER" && (
          <>
            <Field label="Company Name">
              {editing ? <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} /> : <p>{companyName || "-"}</p>}
            </Field>
            <Field label="Deal Specialty">
              {editing ? <Input value={dealSpecialty} onChange={(e) => setDealSpecialty(e.target.value)} /> : <p>{dealSpecialty || "-"}</p>}
            </Field>
          </>
        )}
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
