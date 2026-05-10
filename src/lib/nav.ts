import type { Role } from "@/lib/auth";

export type NavItem = { to: string; label: string; iconName: string };

export const ROLE_HOME: Record<Role, string> = {
  ADMIN: "/admin/dashboard",
  LEGAL_PRACTITIONER: "/legal/dashboard",
  DEAL_MAKER: "/dealer/dashboard",
  USER: "/login",
};

export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Administrator",
  LEGAL_PRACTITIONER: "Legal Practitioner",
  DEAL_MAKER: "Deal Maker",
  USER: "Legacy Client",
};

export const ROLE_THEME: Record<Role, { tone: string; accent: string; sidebar: string }> = {
  ADMIN: { tone: "Operational", accent: "bg-primary text-primary-foreground", sidebar: "bg-primary text-primary-foreground" },
  LEGAL_PRACTITIONER: { tone: "Professional", accent: "bg-accent text-accent-foreground", sidebar: "bg-primary text-primary-foreground" },
  DEAL_MAKER: { tone: "Decision", accent: "bg-gold text-gold-foreground", sidebar: "bg-primary text-primary-foreground" },
  USER: { tone: "Legacy", accent: "bg-secondary text-secondary-foreground", sidebar: "bg-primary text-primary-foreground" },
};

export const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  ADMIN: [
    { to: "/admin/dashboard", label: "Dashboard", iconName: "Gauge" },
    { to: "/admin/clients", label: "Clients", iconName: "Users" },
    { to: "/admin/audit", label: "Audit Log", iconName: "ScrollText" },
    { to: "/admin/reports", label: "Reports", iconName: "BarChart3" },
  ],
  LEGAL_PRACTITIONER: [
    { to: "/legal/dashboard", label: "Dashboard", iconName: "Gauge" },
    { to: "/legal/documents", label: "My Documents", iconName: "FileText" },
    { to: "/legal/rules", label: "Rules Workspace", iconName: "Gavel" },
    { to: "/legal/reports", label: "Compliance Reports", iconName: "ClipboardCheck" },
    { to: "/profile", label: "My Profile", iconName: "User" },
  ],
  DEAL_MAKER: [
    { to: "/dealer/dashboard", label: "Overview", iconName: "Gauge" },
    { to: "/dealer/upload", label: "Upload & Analyze", iconName: "UploadCloud" },
    { to: "/dealer/deals", label: "My Deals", iconName: "Briefcase" },
    { to: "/dealer/risk", label: "Risk Summary", iconName: "ShieldAlert" },
    { to: "/profile", label: "My Profile", iconName: "User" },
  ],
  USER: [],
};
