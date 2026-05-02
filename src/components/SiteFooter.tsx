import { Scale } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background py-12">
      <div className="container flex flex-col items-start justify-between gap-6 text-sm text-muted-foreground sm:flex-row sm:items-center">
        <div className="flex items-center gap-2.5">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-gradient-ink text-primary-foreground">
            <Scale className="h-3.5 w-3.5" />
          </span>
          <span className="text-display text-base font-semibold text-foreground">ALIS</span>
          <span className="text-mono text-[10px] uppercase tracking-[0.18em]">
            © {new Date().getFullYear()} Automated Legal Intelligence
          </span>
        </div>
        <p className="text-mono text-[11px] uppercase tracking-[0.18em]">
          Made in South Africa · For South African law
        </p>
      </div>
    </footer>
  );
}
