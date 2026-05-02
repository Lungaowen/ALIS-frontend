import { Badge } from "@/components/ui/badge";
import type { RiskLevel } from "@/lib/alis";
import { cn } from "@/lib/utils";

export function RiskBadge({ level, className }: { level?: RiskLevel; className?: string }) {
  if (!level) return null;
  const styles: Record<RiskLevel, string> = {
    LOW: "bg-accent/15 text-accent border-accent/30",
    MEDIUM: "bg-gold/20 text-gold-foreground border-gold/40",
    HIGH: "bg-destructive/15 text-destructive border-destructive/40",
  };
  return (
    <Badge variant="outline" className={cn("text-mono text-[10px] uppercase tracking-[0.16em]", styles[level], className)}>
      {level} risk
    </Badge>
  );
}

export function StatusBadge({ status, className }: { status?: string; className?: string }) {
  if (!status) return null;
  const s = status.toUpperCase();
  const tone =
    s === "ANALYZED" || s === "COMPLETED"
      ? "bg-accent/15 text-accent border-accent/30"
      : s === "FAILED"
      ? "bg-destructive/15 text-destructive border-destructive/40"
      : "bg-secondary text-foreground border-border";
  return (
    <Badge variant="outline" className={cn("text-mono text-[10px] uppercase tracking-[0.16em]", tone, className)}>
      {s.replace(/_/g, " ")}
    </Badge>
  );
}
