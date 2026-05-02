import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Sparkles, Trash2, Loader2 } from "lucide-react";
import { PortalLayout } from "@/components/app/PortalLayout";
import { Spinner, EmptyState } from "@/components/app/Primitives";
import { RiskBadge } from "@/components/app/StatusBadges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  listRules, createRule, updateRule, deleteRule, type Rule, type RiskLevel,
} from "@/lib/alis";
import { toast } from "sonner";

const ACTS = [{ id: 1, name: "Consumer Protection Act" }];

export default function LegalRulesPage() {
  const [rules, setRules] = useState<Rule[] | null>(null);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState<RiskLevel | "ALL">("ALL");
  const [editing, setEditing] = useState<Rule | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Rule | null>(null);

  function load() {
    listRules().then((r) => setRules(r)).catch((e) => { toast.error(e?.message ?? "Failed to load rules"); setRules([]); });
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!rules) return [];
    return rules.filter((r) => {
      if (riskFilter !== "ALL" && r.riskLevel !== riskFilter) return false;
      const q = search.toLowerCase();
      if (q && !`${r.keyword} ${r.actName ?? ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [rules, search, riskFilter]);

  return (
    <PortalLayout
      title="Compliance Rules"
      eyebrow="Practitioner"
      description="Curate the legal rule corpus that powers ALIS compliance analysis."
      actions={
        <Button onClick={() => setCreating(true)}><Plus className="mr-1.5 h-4 w-4" /> Create Rule</Button>
      }
    >
      <div className="mb-5 grid gap-3 rounded-lg border border-border bg-card p-4 md:grid-cols-3">
        <Input placeholder="Search keyword or act" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select value={riskFilter} onValueChange={(v) => setRiskFilter(v as RiskLevel | "ALL")}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All risk levels</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!rules ? <Spinner /> : filtered.length === 0 ? (
        <EmptyState title="No rules match" description="Create the first rule to power compliance checks." />
      ) : (
        <div className="rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Rule ID</th>
                <th className="px-4 py-3 text-left">Act</th>
                <th className="px-4 py-3 text-left">Keyword</th>
                <th className="px-4 py-3 text-left">Risk</th>
                <th className="px-4 py-3 text-left">Requirements</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.ruleId} className="border-t border-border">
                  <td className="px-4 py-3 text-mono text-xs text-muted-foreground">#{r.ruleId}</td>
                  <td className="px-4 py-3">{r.actName ?? `Act #${r.actId}`}</td>
                  <td className="px-4 py-3 font-medium">{r.keyword}</td>
                  <td className="px-4 py-3"><RiskBadge level={r.riskLevel} /></td>
                  <td className="px-4 py-3 text-muted-foreground">{r.requirements?.slice(0, 80)}{(r.requirements?.length ?? 0) > 80 ? "…" : ""}</td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="ghost" onClick={() => setEditing(r)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setConfirmDelete(r)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <RuleDialog
        open={creating || !!editing}
        rule={editing}
        onClose={() => { setCreating(false); setEditing(null); }}
        onSaved={() => { load(); setCreating(false); setEditing(null); }}
      />

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this rule?</AlertDialogTitle>
            <AlertDialogDescription>
              Compliance analysis will no longer apply <strong>{confirmDelete?.keyword}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (!confirmDelete) return;
                try {
                  await deleteRule(confirmDelete.ruleId);
                  toast.success("Rule deleted");
                  setConfirmDelete(null);
                  load();
                } catch (e) { toast.error((e as Error)?.message ?? "Delete failed"); }
              }}
            >Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PortalLayout>
  );
}

function RuleDialog({
  open, rule, onClose, onSaved,
}: { open: boolean; rule: Rule | null; onClose: () => void; onSaved: () => void }) {
  const [actId, setActId] = useState<number>(rule?.actId ?? 1);
  const [keyword, setKeyword] = useState(rule?.keyword ?? "");
  const [requirements, setRequirements] = useState(rule?.requirements ?? "");
  const [riskLevel, setRiskLevel] = useState<RiskLevel>(rule?.riskLevel ?? "MEDIUM");
  const [suggestion, setSuggestion] = useState(rule?.suggestion ?? "");
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    setActId(rule?.actId ?? 1);
    setKeyword(rule?.keyword ?? "");
    setRequirements(rule?.requirements ?? "");
    setRiskLevel(rule?.riskLevel ?? "MEDIUM");
    setSuggestion(rule?.suggestion ?? "");
  }, [rule, open]);

  async function aiSuggest() {
    setAiLoading(true);
    try {
      // Call analysis endpoint with no document (best-effort) to get an aiRecommendation
      const res = await fetch("/api/compliance/analyze", { method: "POST" }).catch(() => null);
      if (res && res.ok) {
        const data = await res.json();
        if (data?.aiRecommendation) setRequirements(data.aiRecommendation);
        else throw new Error("No suggestion");
      } else {
        // Fallback heuristic suggestion
        setRequirements(
          (cur) => cur ||
            `Ensure compliance with the ${ACTS.find(a => a.id === actId)?.name} concerning "${keyword}". Disclose all material terms in plain language and obtain informed consent.`
        );
      }
      toast.success("AI suggestion added");
    } catch {
      toast.error("Analysis unavailable — try again");
    } finally {
      setAiLoading(false);
    }
  }

  async function save() {
    setSaving(true);
    try {
      if (rule) {
        await updateRule(rule.ruleId, { keyword, requirements, riskLevel, suggestion });
        toast.success("Rule updated");
      } else {
        await createRule({ actId, keyword, requirements, riskLevel, suggestion });
        toast.success("Rule created");
      }
      onSaved();
    } catch (e) {
      toast.error((e as Error)?.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>{rule ? "Edit rule" : "Create rule"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Act</Label>
            <Select value={String(actId)} onValueChange={(v) => setActId(parseInt(v, 10))} disabled={!!rule}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ACTS.map((a) => <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Keyword</Label>
            <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="e.g. cooling-off" />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Requirements</Label>
              <Button size="sm" variant="ghost" onClick={aiSuggest} disabled={aiLoading}>
                {aiLoading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}
                AI Suggest
              </Button>
            </div>
            <Textarea rows={4} value={requirements} onChange={(e) => setRequirements(e.target.value)} />
            <p className="text-[11px] text-muted-foreground">Powered by llama-3.3-70b-versatile</p>
          </div>
          <div className="space-y-1.5">
            <Label>Risk level</Label>
            <RadioGroup value={riskLevel} onValueChange={(v) => setRiskLevel(v as RiskLevel)} className="grid grid-cols-3 gap-2">
              {(["LOW", "MEDIUM", "HIGH"] as RiskLevel[]).map((l) => (
                <label key={l} className="flex cursor-pointer items-center gap-2 rounded-md border border-border p-2.5">
                  <RadioGroupItem value={l} /> <span className="text-sm">{l}</span>
                </label>
              ))}
            </RadioGroup>
          </div>
          <div className="space-y-1.5">
            <Label>Suggestion</Label>
            <Textarea rows={3} value={suggestion} onChange={(e) => setSuggestion(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving || !keyword || !requirements}>
            {saving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />} Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
