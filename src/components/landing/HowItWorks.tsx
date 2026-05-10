const steps = [
  {
    n: "01",
    title: "Upload",
    body: "Drop a supported document into the workspace. Upload starts the processing pipeline immediately.",
  },
  {
    n: "02",
    title: "Extract",
    body: "ALIS extracts readable text and selects the most relevant active legal rules.",
  },
  {
    n: "03",
    title: "Analyse",
    body: "Groq returns a structured risk level, similarity score, recommendation, and explanation.",
  },
  {
    n: "04",
    title: "Report",
    body: "Download the PDF report, ready for board, counsel, or regulator review.",
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
            From document upload to defensible verdict in four moves.
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
