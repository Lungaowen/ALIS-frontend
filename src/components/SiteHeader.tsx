import { Link, useLocation } from "react-router-dom";
import { Scale, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { ApiBaseDialog } from "@/components/ApiBaseDialog";
import { ROLE_HOME } from "@/lib/nav";

export function SiteHeader() {
  const { isAuthenticated, logout, session } = useAuth();
  const location = useLocation();
  const onApp = ["/admin", "/legal", "/dealer", "/profile"].some((path) =>
    location.pathname.startsWith(path)
  );
  const dashboardPath = session?.role ? ROLE_HOME[session.role] : "/login";

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 glass">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="group flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-gradient-ink text-primary-foreground shadow-soft transition-transform group-hover:rotate-[-6deg]">
            <Scale className="h-4.5 w-4.5" strokeWidth={1.75} />
          </span>
          <span className="text-display text-xl font-semibold tracking-tight">
            ALIS
          </span>
          <span className="hidden text-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground sm:inline">
            Legal Intelligence
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          {!onApp && (
            <>
              <a href="#capabilities" className="story-link hover:text-foreground">Capabilities</a>
              <a href="#roles" className="story-link hover:text-foreground">For your team</a>
              <a href="#how" className="story-link hover:text-foreground">How it works</a>
            </>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <ApiBaseDialog />
          {isAuthenticated ? (
            <>
              <span className="hidden text-xs text-muted-foreground sm:inline">
                {session?.fullName}
              </span>
              <Button asChild variant="ghost" size="sm">
                <Link to={dashboardPath}>Dashboard</Link>
              </Button>
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="mr-1.5 h-3.5 w-3.5" /> Sign out
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/login">Sign in</Link>
              </Button>
              <Button asChild variant="hero" size="sm">
                <Link to="/register">Get started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
