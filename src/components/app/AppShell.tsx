import type { ReactNode } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { AppSidebar } from "@/components/app/AppSidebar";

export function AppShell({
  title,
  eyebrow,
  description,
  actions,
  children,
}: {
  title: string;
  eyebrow?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="flex">
        <AppSidebar />
        <main className="min-w-0 flex-1">
          <div className="border-b border-border bg-gradient-card">
            <div className="container py-10">
              {eyebrow && (
                <p className="text-mono text-[11px] uppercase tracking-[0.22em] text-accent">
                  {eyebrow}
                </p>
              )}
              <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h1 className="text-display text-3xl font-semibold tracking-tight sm:text-4xl">
                    {title}
                  </h1>
                  {description && (
                    <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
                      {description}
                    </p>
                  )}
                </div>
                {actions}
              </div>
            </div>
          </div>
          <div className="container animate-fade-in-up py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
