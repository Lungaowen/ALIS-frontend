import { NavLink, useLocation } from "react-router-dom";
import { FileText, Gauge, Gavel, Upload, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

// Map each role to its base URL prefix
const ROLE_BASE: Record<string, string> = {
  ADMIN: "/admin",
  LEGAL_PRACTITIONER: "/legal",
  DEAL_MAKER: "/dealer",
  USER: "/user",
};

export function AppSidebar() {
  const { role } = useAuth();
  const loc = useLocation();

  // Fallback to "/" for safety, but the sidebar only renders for authenticated users
  const base = role ? ROLE_BASE[role] ?? "/" : "/";

  // Build navigation items dynamically
  const items = [
    {
      to: `${base}/dashboard`,
      label: "Overview",
      icon: Gauge,
      roles: ["ADMIN", "LEGAL_PRACTITIONER", "DEAL_MAKER", "USER"],
    },
    {
      to: `${base}/upload`,
      label: "Upload & analyze",
      icon: Upload,
      roles: ["LEGAL_PRACTITIONER", "DEAL_MAKER", "USER"], // admins don't upload in this scheme
    },
    {
      to: `${base}/documents`,
      label: "My documents",
      icon: FileText,
      roles: ["LEGAL_PRACTITIONER", "DEAL_MAKER", "USER"],
    },
    {
      to: `${base}/rules`,
      label: "Rules workspace",
      icon: Gavel,
      roles: ["LEGAL_PRACTITIONER"],
    },
    {
      to: "/profile",
      label: "My Profile",
      icon: User,
      roles: ["ADMIN", "LEGAL_PRACTITIONER", "DEAL_MAKER", "USER"],
    },
  ];

  // Filter items that the current role can see
  const visibleItems = items.filter(
    (item) => !role || item.roles.includes(role)
  );

  return (
    <aside className="hidden w-60 shrink-0 border-r border-border bg-card/50 lg:block">
      <nav className="sticky top-16 flex flex-col gap-1 p-4">
        <p className="mb-3 px-2 text-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Workspace
        </p>
        {visibleItems.map((it) => {
          const active =
            loc.pathname === it.to ||
            (it.to !== `${base}/dashboard` && loc.pathname.startsWith(it.to));
          const Icon = it.icon;
          return (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.to === `${base}/dashboard`}
              className={({ isActive }) =>
                cn(
                  "group flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                )
              }
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