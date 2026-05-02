const steps = [
  {
    n: "01",
    title: "Upload",
    body: "Drop a PDF into the workspace. Multipart upload triggers the AI pipeline immediately.",
  },
  {
    n: "02",
    title: "Analyse",
    body: "Embeddings, rule-matching, and similarity scoring run against the indexed SA statute corpus.",
  },
  {
    n: "03",
    title: "Verdict",
    body: "A persisted report lands in your inbox: risk level, citation, recommendation, explanation.",
  },
  {
    n: "04",
    title: "Defend",
    body: "Download the signed PDF report — ready for board, counsel, or regulator review.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="relative border-t border-border py-24 lg:py-32">
      <div className="container">
        <div className="max-w-2xl">
          <p className="text-mono text-[11px] uppercase tracking-[0.22em] text-accent">
            The workflow
          </p>
          <h2 className="mt-4 text-display text-4xl font-semibold tracking-tight sm:text-5xl">
            From PDF to defensible verdict in four moves.
          </h2>
        </div>

        <ol className="mt-16 grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <li key={s.n} className="group relative bg-card p-7">
              <span className="text-display text-5xl font-semibold text-muted-foreground/40 transition-colors duration-500 group-hover:text-accent">
                {s.n}
              </span>
              <h3 className="mt-4 text-display text-xl font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {s.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
