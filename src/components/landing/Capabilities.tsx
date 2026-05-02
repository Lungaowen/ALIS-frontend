import { FileSearch, Gavel, GitBranch, Layers, Lock, Sparkles } from "lucide-react";

const items = [
  {
    icon: FileSearch,
    title: "Statute-grounded analysis",
    body: "Every verdict cites the exact South African Act, section, and rule keyword that drove the conclusion.",
  },
  {
    icon: Gavel,
    title: "Defensible verdicts",
    body: "Risk levels, similarity scores, and AI rationale are persisted as auditable reports — never ephemeral.",
  },
  {
    icon: Layers,
    title: "Document pipeline",
    body: "Upload triggers ingestion, embedding, rule-matching, and report generation — fully asynchronous.",
  },
  {
    icon: GitBranch,
    title: "Rules workspace",
    body: "Legal practitioners craft, version, and curate rules. Deal makers consume the verdicts.",
  },
  {
    icon: Lock,
    title: "Role-aware access",
    body: "ADMIN, USER, LEGAL_PRACTITIONER, and DEAL_MAKER each see exactly what they're entitled to.",
  },
  {
    icon: Sparkles,
    title: "Explainable AI",
    body: "Recommendation plus explanation, model version, and the rule that fired — all on one page.",
  },
];

export function Capabilities() {
  return (
    <section id="capabilities" className="relative border-t border-border py-24 lg:py-32">
      <div className="container">
        <div className="max-w-2xl">
          <p className="text-mono text-[11px] uppercase tracking-[0.22em] text-accent">
            Capabilities
          </p>
          <h2 className="mt-4 text-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            A compliance engine designed for the way legal teams actually work.
          </h2>
          <p className="mt-5 text-lg text-muted-foreground">
            Six core capabilities, one cohesive workflow — from upload to
            downloadable PDF report.
          </p>
        </div>

        <div className="mt-16 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it, i) => {
            const Icon = it.icon;
            return (
              <article
                key={it.title}
                className="group relative bg-card p-7 transition-colors duration-500 hover:bg-secondary/50"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <span className="grid h-11 w-11 place-items-center rounded-md bg-gradient-ink text-primary-foreground shadow-soft transition-transform duration-500 group-hover:rotate-[-4deg] group-hover:scale-105">
                  <Icon className="h-5 w-5" strokeWidth={1.6} />
                </span>
                <h3 className="mt-6 text-display text-xl font-semibold tracking-tight">
                  {it.title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                  {it.body}
                </p>
                <span className="absolute bottom-0 left-0 h-px w-0 bg-gradient-emerald transition-all duration-700 group-hover:w-full" />
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
