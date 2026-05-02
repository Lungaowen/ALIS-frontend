import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import heroImage from "@/assets/hero-alis.jpg";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-hero">
      <div className="absolute inset-0 bg-grid opacity-60" aria-hidden />
      <div className="container relative grid gap-12 py-20 lg:grid-cols-12 lg:gap-8 lg:py-32">
        {/* Copy */}
        <div className="lg:col-span-7">
          <div className="inline-flex animate-fade-in items-center gap-2 rounded-full border border-border bg-card/60 px-3.5 py-1.5 text-xs text-muted-foreground backdrop-blur">
            <span className="grid h-1.5 w-1.5 place-items-center rounded-full bg-accent">
              <span className="absolute h-3 w-3 animate-pulse-glow rounded-full bg-accent/40" />
            </span>
            <span className="text-mono uppercase tracking-[0.18em]">SA Compliance Engine · v1.0</span>
          </div>

          <h1 className="mt-7 animate-fade-in-up text-display text-5xl font-semibold leading-[1.02] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            Legal compliance,
            <br />
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-foreground via-primary-glow to-accent bg-clip-text text-transparent">
                read between the lines.
              </span>
              <svg
                className="absolute -bottom-2 left-0 h-3 w-full animate-draw-line"
                viewBox="0 0 400 12"
                fill="none"
                preserveAspectRatio="none"
              >
                <path
                  d="M2 8 Q 100 2, 200 6 T 398 4"
                  stroke="hsl(var(--gold))"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray="1000"
                  strokeDashoffset="1000"
                />
              </svg>
            </span>
          </h1>

          <p className="mt-7 max-w-2xl animate-fade-in-up text-lg leading-relaxed text-muted-foreground animation-delay-200">
            ALIS is the Automated Legal Intelligence System for South African
            statutes. Upload a contract, policy, or filing &mdash; receive a defensible
            compliance verdict, risk grading, and the exact regulatory citations
            behind it.
          </p>

          <div className="mt-10 flex animate-fade-in-up flex-wrap items-center gap-3 animation-delay-300">
            <Button asChild variant="hero" size="xl">
              <Link to="/register">
                Begin a compliance review <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="ghost" size="xl">
              <Link to="/login" className="story-link">Sign in to your workspace</Link>
            </Button>
          </div>

          <dl className="mt-14 grid max-w-xl animate-fade-in-up grid-cols-3 gap-6 border-t border-border pt-8 animation-delay-500">
            {[
              { k: "Acts indexed", v: "120+" },
              { k: "Mean review", v: "< 30s" },
              { k: "Citations / report", v: "Avg. 14" },
            ].map((s) => (
              <div key={s.k}>
                <dt className="text-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  {s.k}
                </dt>
                <dd className="mt-1.5 text-display text-2xl font-semibold text-foreground">
                  {s.v}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Visual */}
        <div className="relative lg:col-span-5">
          <div className="relative animate-scale-in animation-delay-200">
            <div
              className="absolute -inset-6 rounded-3xl bg-gradient-emerald opacity-20 blur-3xl"
              aria-hidden
            />
            <div className="relative overflow-hidden rounded-2xl border border-border shadow-elegant">
              <img
                src={heroImage}
                alt="Abstract visualization of legal documents connected by compliance signals"
                width={1600}
                height={1200}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/40 via-transparent to-transparent" />

              {/* Floating verdict card */}
              <div className="absolute bottom-5 left-5 right-5 animate-slide-in-right rounded-xl border border-border/80 glass p-4 shadow-elegant animation-delay-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-8 w-8 place-items-center rounded-md bg-gradient-emerald text-accent-foreground">
                      <ShieldCheck className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                        Verdict · CPA_Act.pdf
                      </p>
                      <p className="text-sm font-medium text-foreground">
                        Compliant — low legal risk
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-accent/15 px-2.5 py-1 text-mono text-[11px] font-medium text-accent">
                    80% match
                  </span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full w-[80%] rounded-full bg-gradient-emerald" />
                </div>
              </div>
            </div>

            {/* Floating chip */}
            <div className="absolute -left-6 top-10 hidden animate-float rounded-xl border border-border bg-card p-3 shadow-soft md:block">
              <div className="flex items-center gap-2 text-xs">
                <Sparkles className="h-3.5 w-3.5 text-gold" />
                <span className="text-mono uppercase tracking-[0.16em] text-muted-foreground">
                  llama-3.3-70b
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
