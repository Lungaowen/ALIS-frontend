import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  createRule,
  deleteRule,
  listRules,
  updateRule,
  type Rule,
  type RiskLevel,
} from "@/lib/alis";
import { RiskBadge } from "@/components/app/StatusBadges";

interface FormState {
  actId: number;
  keyword: string;
  requirements: string;
  riskLevel: RiskLevel;
  suggestion: string;
}
const EMPTY: FormState = {
  actId: 1,
  keyword: "",
  requirements: "",
  riskLevel: "MEDIUM",
  suggestion: "",
};

export default function RulesPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["rules"], queryFn: listRules });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Rule | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);

  const refresh = () => qc.invalidateQueries({ queryKey: ["rules"] });

  const createM = useMutation({
    mutationFn: () => createRule(form),
    onSuccess: () => {
      toast.success("Rule created");
      setOpen(false);
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const updateM = useMutation({
    mutationFn: () =>
      updateRule(editing!.ruleId, {
        keyword: form.keyword,
        requirements: form.requirements,
        riskLevel: form.riskLevel,
        suggestion: form.suggestion,
      }),
    onSuccess: () => {
      toast.success("Rule updated");
      setOpen(false);
      setEditing(null);
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const deleteM = useMutation({
    mutationFn: (id: number) => deleteRule(id),
    onSuccess: () => {
      toast.success("Rule deleted");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setOpen(true);
  };
  const openEdit = (r: Rule) => {
    setEditing(r);
    setForm({
      actId: r.actId,
      keyword: r.keyword,
      requirements: r.requirements,
      riskLevel: r.riskLevel,
      suggestion: r.suggestion,
    });
    setOpen(true);
  };

  return (
    <AppShell
      eyebrow="Practitioner only"
      title="Rules workspace"
      description="Curate the compliance corpus that ALIS evaluates documents against."
      actions={
        <Button variant="hero" onClick={openCreate}>
          <Plus className="h-4 w-4" /> New rule
        </Button>
      }
    >
      {q.isLoading ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          Loading rules…
        </div>
      ) : q.isError ? (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-6 text-sm text-destructive">
          {(q.error as Error).message}
        </div>
      ) : (q.data ?? []).length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <p className="text-display text-lg">No rules yet</p>
          <Button variant="hero" size="sm" className="mt-5" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Create the first rule
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              <tr>
                <th className="px-5 py-3 text-left">Keyword</th>
                <th className="px-5 py-3 text-left">Act</th>
                <th className="px-5 py-3 text-left">Risk</th>
                <th className="px-5 py-3 text-left">Requirement</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {q.data!.map((r) => (
                <tr key={r.ruleId} className="transition-colors hover:bg-secondary/40">
                  <td className="px-5 py-4 font-medium">{r.keyword}</td>
                  <td className="px-5 py-4 text-muted-foreground">{r.actName ?? `#${r.actId}`}</td>
                  <td className="px-5 py-4"><RiskBadge level={r.riskLevel} /></td>
                  <td className="max-w-md px-5 py-4 text-muted-foreground">
                    <p className="line-clamp-2">{r.requirements}</p>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(r)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Delete rule "${r.keyword}"?`)) deleteM.mutate(r.ruleId);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-display text-2xl">
              {editing ? "Edit rule" : "New rule"}
            </DialogTitle>
            <DialogDescription>
              Rules are matched against uploaded documents during compliance analysis.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <Label htmlFor="actId">Act ID</Label>
                <Input
                  id="actId"
                  type="number"
                  value={form.actId}
                  disabled={!!editing}
                  onChange={(e) => setForm({ ...form, actId: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="risk">Risk level</Label>
                <Select
                  value={form.riskLevel}
                  onValueChange={(v) => setForm({ ...form, riskLevel: v as RiskLevel })}
                >
                  <SelectTrigger id="risk"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">LOW</SelectItem>
                    <SelectItem value="MEDIUM">MEDIUM</SelectItem>
                    <SelectItem value="HIGH">HIGH</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="keyword">Keyword</Label>
              <Input
                id="keyword"
                value={form.keyword}
                onChange={(e) => setForm({ ...form, keyword: e.target.value })}
                placeholder="cooling-off period"
              />
            </div>
            <div>
              <Label htmlFor="req">Requirements</Label>
              <Textarea
                id="req"
                rows={3}
                value={form.requirements}
                onChange={(e) => setForm({ ...form, requirements: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="sug">Suggestion</Label>
              <Textarea
                id="sug"
                rows={2}
                value={form.suggestion}
                onChange={(e) => setForm({ ...form, suggestion: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              variant="hero"
              onClick={() => (editing ? updateM.mutate() : createM.mutate())}
              disabled={createM.isPending || updateM.isPending}
            >
              {editing ? "Save changes" : "Create rule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
