import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Spinner({ label, className }: { label?: string; className?: string }) {
  return (
    <div className={cn("flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground", className)}>
      <Loader2 className="h-4 w-4 animate-spin text-accent" />
      {label && <span>{label}</span>}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/40 px-6 py-16 text-center">
      {icon && <div className="mb-3 text-muted-foreground">{icon}</div>}
      <h3 className="text-base font-medium text-foreground">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "default" | "accent" | "destructive" | "gold";
}) {
  const toneClass =
    tone === "accent"
      ? "border-accent/30"
      : tone === "destructive"
      ? "border-destructive/30"
      : tone === "gold"
      ? "border-gold/40"
      : "border-border";
  return (
    <div className={cn("rounded-lg border bg-gradient-card p-5 shadow-soft", toneClass)}>
      <p className="text-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-display text-3xl font-semibold tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** Circular progress gauge. value 0–100. */
export function Gauge({
  value,
  size = 140,
  label,
  sublabel,
  tone = "accent",
}: {
  value: number;
  size?: number;
  label?: string;
  sublabel?: string;
  tone?: "accent" | "destructive" | "gold" | "primary";
}) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (v / 100) * c;
  const colorVar =
    tone === "destructive"
      ? "hsl(var(--destructive))"
      : tone === "gold"
      ? "hsl(var(--gold))"
      : tone === "primary"
      ? "hsl(var(--primary))"
      : "hsl(var(--accent))";
  return (
    <div className="inline-flex flex-col items-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="hsl(var(--muted))" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colorVar}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          fill="none"
          style={{ transition: "stroke-dashoffset 600ms var(--ease-out-expo, ease)" }}
        />
      </svg>
      <div className="-mt-[calc(50%+8px)] flex h-0 items-center justify-center" style={{ height: 0 }}>
        <div className="text-center" style={{ transform: `translateY(-${size / 2 + 18}px)` }}>
          <div className="text-display text-2xl font-semibold tracking-tight">{v}%</div>
          {label && <div className="text-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</div>}
        </div>
      </div>
      {sublabel && <div className="mt-2 text-xs text-muted-foreground">{sublabel}</div>}
    </div>
  );
}

export function ProgressBar({ value, tone = "accent" }: { value: number; tone?: "accent" | "destructive" | "gold" }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  const bg =
    tone === "destructive"
      ? "bg-destructive"
      : tone === "gold"
      ? "bg-gold"
      : "bg-accent";
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div className={cn("h-full rounded-full transition-all", bg)} style={{ width: `${v}%` }} />
    </div>
  );
}

export function PermissionDenied({ message }: { message?: string }) {
  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">
      <p className="font-medium">Permission denied</p>
      <p className="mt-1 text-destructive/80">{message ?? "Your role does not have access to this action."}</p>
    </div>
  );
}
