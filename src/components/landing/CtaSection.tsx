import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CtaSection() {
  return (
    <section className="relative overflow-hidden border-t border-border bg-gradient-ink py-24 text-primary-foreground lg:py-32">
      <div className="absolute inset-0 bg-grid opacity-20" aria-hidden />
      <div
        className="absolute -right-32 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-accent/30 blur-[120px]"
        aria-hidden
      />
      <div className="container relative">
        <div className="grid items-center gap-10 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <p className="text-mono text-[11px] uppercase tracking-[0.22em] text-accent-glow">
              Ready when you are
            </p>
            <h2 className="mt-4 text-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Stop reading 800-page Acts.
              <br />
              Start defending decisions.
            </h2>
          </div>
          <div className="flex flex-col items-start gap-3 lg:col-span-4 lg:items-end">
            <Button asChild variant="emerald" size="xl">
              <Link to="/register">
                Open a free workspace <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Link to="/login" className="story-link text-sm text-primary-foreground/70">
              I already have an account
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
