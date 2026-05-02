import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Scale } from "lucide-react";

interface Props {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthShell({ title, subtitle, children, footer }: Props) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Form side */}
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Link to="/" className="group inline-flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-gradient-ink text-primary-foreground shadow-soft transition-transform group-hover:rotate-[-6deg]">
            <Scale className="h-4.5 w-4.5" strokeWidth={1.75} />
          </span>
          <span className="text-display text-xl font-semibold tracking-tight">ALIS</span>
        </Link>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          <div className="animate-fade-in-up">
            <h1 className="text-display text-3xl font-semibold tracking-tight sm:text-4xl">
              {title}
            </h1>
            <p className="mt-2 text-muted-foreground">{subtitle}</p>
          </div>

          <div className="mt-8 animate-fade-in-up animation-delay-200">{children}</div>

          {footer && (
            <div className="mt-8 animate-fade-in-up text-sm text-muted-foreground animation-delay-300">
              {footer}
            </div>
          )}
        </div>

        <p className="text-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Automated Legal Intelligence System
        </p>
      </div>

      {/* Visual side */}
      <div className="relative hidden overflow-hidden bg-gradient-ink lg:block">
        <div className="absolute inset-0 bg-grid opacity-25" aria-hidden />
        <div
          className="absolute -bottom-32 -right-32 h-[28rem] w-[28rem] rounded-full bg-accent/30 blur-[120px]"
          aria-hidden
        />
        <div
          className="absolute -top-24 left-1/4 h-72 w-72 rounded-full bg-gold/20 blur-[100px]"
          aria-hidden
        />

        <div className="relative flex h-full flex-col justify-between p-12 text-primary-foreground">
          <p className="text-mono text-[11px] uppercase tracking-[0.22em] text-accent-glow">
            Compliance · Audited · Defensible
          </p>

          <figure className="max-w-md animate-fade-in-up animation-delay-300">
            <blockquote className="text-display text-2xl font-medium leading-snug tracking-tight sm:text-3xl">
              &ldquo;ALIS turned an eight-hour statutory review into a thirty-second
              verdict — with citations my partners actually trust.&rdquo;
            </blockquote>
            <figcaption className="mt-6 flex items-center gap-3 text-sm text-primary-foreground/70">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-emerald text-accent-foreground">
                LP
              </span>
              <div>
                <p className="font-medium text-primary-foreground">Lebo Practitioner</p>
                <p className="text-xs">Mokoena Legal · Johannesburg</p>
              </div>
            </figcaption>
          </figure>

          <div className="grid grid-cols-3 gap-6 border-t border-primary-foreground/15 pt-6 text-primary-foreground/70">
            {[
              { k: "Acts", v: "120+" },
              { k: "Avg review", v: "<30s" },
              { k: "Roles", v: "4" },
            ].map((s) => (
              <div key={s.k}>
                <p className="text-mono text-[10px] uppercase tracking-[0.16em]">{s.k}</p>
                <p className="mt-1 text-display text-xl font-semibold text-primary-foreground">
                  {s.v}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
