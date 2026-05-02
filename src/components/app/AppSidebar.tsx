import { NavLink, useLocation } from "react-router-dom";
import { FileText, Gauge, Gavel, Upload } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Overview", icon: Gauge, roles: ["USER", "LEGAL_PRACTITIONER", "DEAL_MAKER", "ADMIN"] },
  { to: "/dashboard/upload", label: "Upload & analyze", icon: Upload, roles: ["USER", "LEGAL_PRACTITIONER", "DEAL_MAKER"] },
  { to: "/dashboard/documents", label: "My documents", icon: FileText, roles: ["USER", "LEGAL_PRACTITIONER", "DEAL_MAKER"] },
  { to: "/dashboard/rules", label: "Rules workspace", icon: Gavel, roles: ["LEGAL_PRACTITIONER"] },
] as const;

export function AppSidebar() {
  const { role } = useAuth();
  const loc = useLocation();
  const items = NAV.filter((n) => !role || (n.roles as readonly string[]).includes(role));

  return (
    <aside className="hidden w-60 shrink-0 border-r border-border bg-card/50 lg:block">
      <nav className="sticky top-16 flex flex-col gap-1 p-4">
        <p className="mb-3 px-2 text-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Workspace
        </p>
        {items.map((it) => {
          const active = loc.pathname === it.to || (it.to !== "/dashboard" && loc.pathname.startsWith(it.to));
          const Icon = it.icon;
          return (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.to === "/dashboard"}
              className={cn(
                "group flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={1.75} />
              <span>{it.label}</span>
              <span
                className={cn(
                  "ml-auto h-1 w-1 rounded-full bg-accent opacity-0 transition-opacity",
                  active && "opacity-100"
                )}
              />
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
