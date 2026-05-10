import { Briefcase, Scale } from "lucide-react";
import { cn } from "@/lib/utils";

const roles = [
  {
    name: "LEGAL PRACTITIONER",
    icon: Scale,
    title: "Counsel & compliance leads",
    tone: "emerald",
    pitch: "An analytical workspace with full Rules CRUD and regulatory context.",
    highlights: ["Rules workspace (CRUD)", "Regulatory citations", "Insight dashboards"],
  },
  {
    name: "DEAL MAKER",
    icon: Briefcase,
    title: "Investors & dealmakers",
    tone: "gold",
    pitch: "Decision-flow optimised: turnaround, risk flags, and deal readiness at a glance.",
    highlights: ["Risk summaries", "Deal readiness", "Fast report downloads"],
  },
];

export function RolesSection() {
  return (
    <section id="roles" className="relative overflow-hidden border-t border-border bg-secondary/40 py-24 lg:py-32">
      <div className="container">
        <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <p className="text-mono text-[11px] uppercase tracking-[0.22em] text-accent">
              For your team
            </p>
            <h2 className="mt-4 text-display text-4xl font-semibold tracking-tight sm:text-5xl">
              One platform, two specialist lenses.
            </h2>
          </div>
          <p className="max-w-md text-muted-foreground">
            Legal practitioners and deal makers get tailored workspaces over the same compliance engine.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          {roles.map((r, i) => {
            const Icon = r.icon;
            return (
              <article
                key={r.name}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border border-border bg-card p-8 hover-lift",
                  r.tone === "emerald" && "ring-gradient"
                )}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "grid h-12 w-12 place-items-center rounded-lg shadow-soft transition-transform duration-500 group-hover:scale-110",
                      r.tone === "emerald"
                        ? "bg-gradient-emerald text-accent-foreground"
                        : "bg-gradient-gold text-gold-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    Role: {r.name}
                  </span>
                </div>

                <h3 className="mt-7 text-display text-2xl font-semibold tracking-tight">
                  {r.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {r.pitch}
                </p>

                <ul className="mt-6 space-y-2.5 border-t border-border pt-6 text-sm">
                  {r.highlights.map((h) => (
                    <li key={h} className="flex items-start gap-2.5 text-foreground/80">
                      <span className="mt-2 inline-block h-1 w-3 rounded-full bg-accent" />
                      {h}
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
